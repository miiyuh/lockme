

// Component imports
import FileEncryptionCard from '@/components/FileEncryptionCard';

/**
 * Decrypt Page Component
 * 
 * This page provides file decryption functionality using the FileEncryptionCard
 * component with the mode set to "decrypt".
 * 
 * @returns {JSX.Element} The decrypt page component
 */
export default function DecryptPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <FileEncryptionCard mode="decrypt" />
      </div>
    </div>
  );
}
