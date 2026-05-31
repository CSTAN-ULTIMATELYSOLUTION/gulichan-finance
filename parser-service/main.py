from datetime import datetime
import re
from typing import Literal

import pdfplumber
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

app = FastAPI(title="Bossku Finance Parser")


class ParsedTransaction(BaseModel):
    date: str
    description: str
    amount: float
    direction: Literal["in", "out"]
    source_file: str


class ParseResult(BaseModel):
    account_institution: str
    statement_month: str | None = None
    transactions: list[ParsedTransaction]
    parse_errors: list[str]


def parse_date(value: str) -> str:
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d/%m/%y"):
        try:
            return datetime.strptime(value.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    raise ValueError(f"Unsupported date: {value}")


def money(value: str) -> float:
    return float(value.replace(",", "").replace("RM", "").strip())


def detect_institution(text: str) -> str:
    upper = text.upper()
    if "TOUCH" in upper and "GO" in upper:
        return "TnG"
    if "PUBLIC BANK" in upper or "PBB" in upper:
        return "Public Bank"
    if "MAXIS" in upper:
        return "Maxis"
    return "Maybank"


def parse_generic_lines(text: str, source_file: str) -> tuple[list[ParsedTransaction], list[str]]:
    rows: list[ParsedTransaction] = []
    errors: list[str] = []
    pattern = re.compile(
        r"(?P<date>\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+"
        r"(?P<description>.+?)\s+"
        r"(?P<amount>RM?\s?[\d,]+\.\d{2}|[\d,]+\.\d{2})\s*"
        r"(?P<marker>CR|DR|DEBIT|CREDIT)?$",
        re.IGNORECASE,
    )
    for line in text.splitlines():
        candidate = " ".join(line.split())
        match = pattern.search(candidate)
        if not match:
            continue
        try:
            marker = (match.group("marker") or "").upper()
            direction: Literal["in", "out"] = "in" if marker in {"CR", "CREDIT"} else "out"
            rows.append(
                ParsedTransaction(
                    date=parse_date(match.group("date")),
                    description=match.group("description").strip(),
                    amount=money(match.group("amount")),
                    direction=direction,
                    source_file=source_file,
                )
            )
        except ValueError as exc:
            errors.append(str(exc))
    return rows, errors


@app.post("/parse", response_model=ParseResult)
async def parse(file: UploadFile = File(...)) -> ParseResult:
    errors: list[str] = []
    transactions: list[ParsedTransaction] = []
    institution = "Maybank"
    text = ""
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text += "\n" + (page.extract_text() or "")
    if text.strip():
        institution = detect_institution(text)
        transactions, errors = parse_generic_lines(text, file.filename or "statement.pdf")
    else:
        errors.append("No extractable text found in PDF.")
    month = transactions[0].date[:7] if transactions else None
    return ParseResult(
        account_institution=institution,
        statement_month=month,
        transactions=transactions,
        parse_errors=errors,
    )
