
import FileEncryptionCard from '@/components/FileEncryptionCard';

export default function DecryptPage() {
  return (
    <div className="container mx-auto py-8">
       <div className="max-w-2xl mx-auto">
        <FileEncryptionCard mode="decrypt" />
      </div>
    </div>
  );
}
