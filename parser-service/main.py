from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import re
import tempfile

import pdfplumber


app = FastAPI(title="Finance PDF Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://*.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParsedTransaction(BaseModel):
    date: str
    description: str
    amount: float
    direction: str
    source_file: str


class ParseResult(BaseModel):
    account_institution: str
    statement_month: Optional[str] = None
    transactions: list[ParsedTransaction]
    parse_errors: list[str]


def detect_bank(text: str) -> str:
    u = text.upper()
    if "MALAYAN BANKING" in u or "MAYBANK" in u:
        return "Maybank"
    if "TNG WALLET" in u or "TNG EWALLET" in u or "TOUCH 'N GO" in u or "TOUCH N GO" in u:
        return "TnG"
    if "PUBLIC BANK" in u or "PBB" in u:
        return "Public Bank"
    if "MAXIS" in u and ("INVOICE" in u or "BILL" in u):
        return "Maxis"
    return "Unknown"


def parse_named_date(value: str) -> Optional[str]:
    month_names = {
        "jan": "01",
        "feb": "02",
        "mar": "03",
        "apr": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "aug": "08",
        "sep": "09",
        "oct": "10",
        "nov": "11",
        "dec": "12",
    }
    m = re.match(r"^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$", value.strip())
    if not m:
        return None
    month = month_names.get(m.group(2)[:3].lower())
    if not month:
        return None
    return f"{m.group(3)}-{month}-{int(m.group(1)):02d}"


def parse_maybank(pdf_path: str, filename: str) -> ParseResult:
    transactions: list[ParsedTransaction] = []
    errors: list[str] = []
    statement_month = None

    patterns = [
        re.compile(r"^(\d{2}/\d{2}/\d{2})\s+(.+?)\s+([\d,]+\.\d{2})([+-])\s+([\d,]+\.\d{2})\s*$"),
        re.compile(r"^(\d{2}/\d{2}/\d{2})\s+(.+?)\s+([\d,]+\.\d{2})\s*([+-])\s+([\d,]+\.\d{2})\s*$"),
    ]

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            m_date = re.search(r"STATEMENT DATE\s*:?\s*(\d{2}/\d{2}/\d{2})", text)
            if m_date and not statement_month:
                day, month, year = m_date.group(1).split("/")
                statement_month = f"20{year}-{month}"

            for line in text.split("\n"):
                line = line.strip()
                if not line:
                    continue
                for pattern in patterns:
                    match = pattern.match(line)
                    if not match:
                        continue
                    raw_date, desc, raw_amt, sign, _balance = match.groups()
                    day, month, year = raw_date.split("/")
                    transactions.append(
                        ParsedTransaction(
                            date=f"20{year}-{month}-{day}",
                            description=desc.strip(),
                            amount=float(raw_amt.replace(",", "")),
                            direction="in" if sign == "+" else "out",
                            source_file=filename,
                        )
                    )
                    break

    return ParseResult(
        account_institution="Maybank",
        statement_month=statement_month,
        transactions=transactions,
        parse_errors=errors,
    )


def parse_tng(pdf_path: str, filename: str) -> ParseResult:
    transactions: list[ParsedTransaction] = []
    errors: list[str] = []
    pattern = re.compile(
        r"^(\d{1,2}/\d{1,2}/\d{4})\s+Success\s+(.+?)\s+(RM[\d,]+\.\d{2})\s+(RM[\d,]+\.\d{2})\s*$"
    )
    in_keywords = [
        "reload",
        "receive from",
        "duitnow_recei",
        "top up",
        "topup",
        "refund",
        "card reload",
        "duitnow transfer received",
        "cashback",
    ]

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                match = pattern.match(line.strip())
                if not match:
                    continue
                raw_date, desc, raw_amt, _balance = match.groups()
                day, month, year = raw_date.split("/")
                desc_lower = desc.lower()
                transactions.append(
                    ParsedTransaction(
                        date=f"{year}-{int(month):02d}-{int(day):02d}",
                        description=desc.strip(),
                        amount=float(raw_amt.replace("RM", "").replace(",", "")),
                        direction="in" if any(keyword in desc_lower for keyword in in_keywords) else "out",
                        source_file=filename,
                    )
                )

    return ParseResult(account_institution="TnG", transactions=transactions, parse_errors=errors)


def parse_publicbank(pdf_path: str, filename: str) -> ParseResult:
    transactions: list[ParsedTransaction] = []
    errors: list[str] = []
    statement_month = None
    pattern = re.compile(
        r"^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2}|-)\s+([\d,]+\.\d{2})\s*$"
    )

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            m_date = re.search(r"STATEMENT DATE\s*:?\s*(\d{2}/\d{2}/\d{4})", text)
            if m_date and not statement_month:
                day, month, year = m_date.group(1).split("/")
                statement_month = f"{year}-{month}"

            for line in text.split("\n"):
                match = pattern.match(line.strip())
                if not match:
                    continue
                raw_date, desc, withdrawal, deposit, _balance = match.groups()
                day, month, year = raw_date.split("/")
                if withdrawal != "-":
                    amount = float(withdrawal.replace(",", ""))
                    direction = "out"
                elif deposit != "-":
                    amount = float(deposit.replace(",", ""))
                    direction = "in"
                else:
                    continue
                transactions.append(
                    ParsedTransaction(
                        date=f"{year}-{month}-{day}",
                        description=desc.strip(),
                        amount=amount,
                        direction=direction,
                        source_file=filename,
                    )
                )

    return ParseResult(
        account_institution="Public Bank",
        statement_month=statement_month,
        transactions=transactions,
        parse_errors=errors,
    )


def parse_maxis(pdf_path: str, filename: str) -> ParseResult:
    errors: list[str] = []
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            full_text += page.extract_text() or ""
            full_text += "\n"

    bill_date = None
    m_date = re.search(r"Bill Date\s*:?\s*(\d{1,2}\s+\w+\s+\d{4})", full_text, re.IGNORECASE)
    if m_date:
        bill_date = parse_named_date(m_date.group(1))

    m_amt = re.search(r"Total Amount Due\s*RM\s*([\d,]+\.\d{2})", full_text, re.IGNORECASE)
    if not m_amt:
        m_amt = re.search(r"AMOUNT DUE\s*RM\s*([\d,]+\.\d{2})", full_text, re.IGNORECASE)
    if not m_amt:
        errors.append("Could not extract total amount from Maxis bill")
        return ParseResult(account_institution="Maxis", transactions=[], parse_errors=errors)

    transaction = ParsedTransaction(
        date=bill_date or "2026-01-01",
        description="MAXIS BROADBAND SDN",
        amount=float(m_amt.group(1).replace(",", "")),
        direction="out",
        source_file=filename,
    )
    return ParseResult(account_institution="Maxis", transactions=[transaction], parse_errors=errors)


@app.get("/health")
def health():
    return {"status": "ok", "service": "finance-pdf-parser"}


@app.post("/parse", response_model=ParseResult)
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files accepted")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "Empty file")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        with pdfplumber.open(tmp_path) as pdf:
            if len(pdf.pages) == 0:
                raise HTTPException(400, "PDF has no pages")
            first_text = pdf.pages[0].extract_text() or ""

        bank = detect_bank(first_text)
        if bank == "Maybank":
            result = parse_maybank(tmp_path, file.filename)
        elif bank == "TnG":
            result = parse_tng(tmp_path, file.filename)
        elif bank == "Public Bank":
            result = parse_publicbank(tmp_path, file.filename)
        elif bank == "Maxis":
            result = parse_maxis(tmp_path, file.filename)
        else:
            raise HTTPException(400, f"Unrecognised bank statement. First 200 chars: {first_text[:200]}")

        if not result.transactions and not result.parse_errors:
            result.parse_errors.append("No transactions matched the supported statement patterns.")
        return result
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(500, f"Parse error: {str(error)}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/debug", response_model=dict)
async def debug_pdf(file: UploadFile = File(...)):
    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = {"pages": [], "detected_bank": "Unknown"}
        with pdfplumber.open(tmp_path) as pdf:
            first_text = pdf.pages[0].extract_text() or "" if pdf.pages else ""
            result["detected_bank"] = detect_bank(first_text)
            for index, page in enumerate(pdf.pages[:3]):
                text = page.extract_text() or ""
                result["pages"].append({"page": index + 1, "text": text, "lines": text.split("\n")})
        return result
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
