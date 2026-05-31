'use client';

import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadResult {
  inserted: number;
  skipped: number;
  detected: string;
  errors: string[];
  error?: string;
}

export function Dropzone() {
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError('');
    setResult(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const body = (await res.json()) as UploadResult;
      if (!res.ok) throw new Error(body.error ?? 'Upload failed.');
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, multiple: false });

  return (
    <div className="w-full max-w-[600px]">
      <div
        {...getRootProps()}
        className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-[#eaecef] bg-[#fafafa] p-12 text-center transition hover:border-primary"
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-muted" />
        <div className="mt-5 text-base font-semibold text-ink">{isDragActive ? 'Drop it here' : 'Drop your bank statement here'}</div>
        <div className="mt-2 text-sm text-muted">Maybank · TnG eWallet · Public Bank · Maxis</div>
        <div className="mt-3 text-sm font-semibold text-primary">or click to browse</div>
      </div>

      {fileName ? (
        <div className="mt-5 inline-flex rounded-full border border-[#eaecef] bg-[#fafafa] px-3 py-1 text-sm font-medium text-ink">
          {loading ? 'Processing ' : ''}
          {fileName}
        </div>
      ) : null}

      {error ? <div className="mt-5 rounded-card border border-[#f6465d]/30 bg-[#fff5f6] p-4 text-sm text-down">{error}</div> : null}

      {result ? (
        <section className="mt-6 rounded-card border border-[#eaecef] bg-[#fafafa] p-6">
          <div className="text-sm text-muted">Detected: <span className="font-semibold text-ink">{result.detected}</span></div>
          <div className="mt-4 font-num text-lg font-bold text-up">{result.inserted} inserted</div>
          <div className="mt-1 text-sm text-muted">{result.skipped} skipped duplicates</div>
          {result.errors.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-down">
              {result.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <button onClick={() => { setResult(null); setFileName(''); }} className="mt-5 h-10 rounded-btn bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active">
            Upload another
          </button>
        </section>
      ) : null}
    </div>
  );
}
