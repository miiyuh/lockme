import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Lock, Unlock, FileText, Shield, ChevronRight, List } from "lucide-react";

export default function Home() {
  return (
    <div className="container px-4 mx-auto my-8">
      <div className="flex flex-col items-center text-center mb-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl font-bold tracking-tight"
        >
          LockMe
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 text-xl text-muted-foreground max-w-2xl"
        >
          Secure file encryption and decryption using AES-256
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-4 mt-6"
        >
          <Button asChild size="lg">
            <Link to="/upload">
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/files">
              <List className="mr-2 h-4 w-4" /> View Files
            </Link>
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:gap-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-center mb-2">File Encryption</h3>
              <p className="text-sm text-center text-muted-foreground">
                Secure your sensitive files with AES-256 encryption.
                Your data remains private and protected.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center pb-6 pt-0">
              <Button variant="outline" asChild>
                <Link to="/upload?tab=encrypt">Encrypt Files</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Unlock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-center mb-2">File Decryption</h3>
              <p className="text-sm text-center text-muted-foreground">
                Easily decrypt your files with the correct password.
                Quick access to your encrypted data.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center pb-6 pt-0">
              <Button variant="outline" asChild>
                <Link to="/upload?tab=decrypt">Decrypt Files</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-center mb-2">File Management</h3>
              <p className="text-sm text-center text-muted-foreground">
                Manage your encrypted and decrypted files in one place.
                Download or delete files as needed.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center pb-6 pt-0">
              <Button variant="outline" asChild>
                <Link to="/files">Manage Files</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <div className="mt-16 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">About LockMe</h2>
        <p className="text-muted-foreground">
          LockMe is a cross-platform application for secure file encryption and decryption.
          We use AES-256, a strong encryption algorithm that's widely trusted for securing sensitive data.
          Your encrypted files can only be accessed with the correct password, ensuring your data stays private.
        </p>
      </div>
    </div>
  );
}
