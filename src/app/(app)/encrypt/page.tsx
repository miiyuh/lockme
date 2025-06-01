

// Component imports
import FileEncryptionCard from '@/components/FileEncryptionCard';

/**
 * Encrypt Page Component
 * 
 * This page provides file encryption functionality using the FileEncryptionCard
 * component with the mode set to "encrypt".
 * 
 * @returns {JSX.Element} The encrypt page component
 */
export default function EncryptPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <FileEncryptionCard mode="encrypt" />
      </div>
    </div>
  );
}
