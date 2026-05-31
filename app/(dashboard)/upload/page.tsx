import { Dropzone } from '@/components/upload/dropzone';

export default function UploadPage() {
  return (
    <div className="-mx-4 -my-6 flex min-h-screen items-center justify-center bg-light px-4 py-12 sm:-mx-6 lg:-mx-8 lg:-my-8">
      <Dropzone />
    </div>
  );
}
