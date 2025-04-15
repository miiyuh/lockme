import tkinter as tk
from tkinter import filedialog, messagebox
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import os

# AES config
BLOCK_SIZE = 16

def pad(data):
    padding = BLOCK_SIZE - len(data) % BLOCK_SIZE
    return data + bytes([padding] * padding)

def unpad(data):
    padding = data[-1]
    return data[:-padding]

def encrypt_file(filepath, key):
    with open(filepath, 'rb') as f:
        data = f.read()
    data = pad(data)
    cipher = AES.new(key, AES.MODE_CBC)
    ciphertext = cipher.iv + cipher.encrypt(data)
    out_path = filepath + ".enc"
    with open(out_path, 'wb') as f:
        f.write(ciphertext)
    return out_path

def decrypt_file(filepath, key):
    with open(filepath, 'rb') as f:
        iv = f.read(16)
        ciphertext = f.read()
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = unpad(cipher.decrypt(ciphertext))
    out_path = filepath.replace('.enc', '.dec')
    with open(out_path, 'wb') as f:
        f.write(decrypted)
    return out_path

def select_file_encrypt():
    file_path = filedialog.askopenfilename()
    if file_path:
        key = get_random_bytes(32)
        with open("key.bin", "wb") as key_file:
            key_file.write(key)
        output = encrypt_file(file_path, key)
        messagebox.showinfo("Success", f"Encrypted file saved as:\n{output}\nKey saved as key.bin")

def select_file_decrypt():
    file_path = filedialog.askopenfilename()
    if file_path:
        try:
            with open("key.bin", "rb") as key_file:
                key = key_file.read()
            output = decrypt_file(file_path, key)
            messagebox.showinfo("Success", f"Decrypted file saved as:\n{output}")
        except FileNotFoundError:
            messagebox.showerror("Error", "Encryption key not found (key.bin)")

# GUI setup
app = tk.Tk()
app.title("LockMe - AES File Encryptor")
app.geometry("300x200")

tk.Button(app, text="Encrypt File", command=select_file_encrypt, width=25).pack(pady=20)
tk.Button(app, text="Decrypt File", command=select_file_decrypt, width=25).pack(pady=10)

app.mainloop()
