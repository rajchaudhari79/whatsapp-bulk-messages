# Bulk WhatsApp Sender Extension

![Logo](icons/icon128.png)

A Google Chrome Extension that allows you to safely send bulk WhatsApp messages from a CSV file. Built with a heavy focus on anti-ban measures to keep your WhatsApp account safe.

## ✨ Features

- **Safe Sending**: Simulates human behavior with randomized delays between messages.
- **Batch Processing**: Automatically pauses after sending a certain number of messages.
- **Message Personalization**: Use variables from your CSV (e.g., `Hello {{Name}}`) to ensure each message is unique, preventing spam detection.
- **CSV Support**: Upload your contacts and data easily using a `.csv` file.
- **No Third-Party APIs**: Works directly within WhatsApp Web, meaning no API costs.

## 🚀 Installation (Developer Mode)

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button.
5. Select the folder where you extracted this repository.
6. The extension is now installed!

## 💡 Usage

1. **Prepare your Data**: Create a Google Sheet or Excel file with your contacts. Ensure you have a column for Phone Numbers (with country codes). Add other columns for variables (like Name). Export the file as a `.csv`.
2. Click the extension icon in your Chrome toolbar.
3. **Upload** your `.csv` file.
4. **Draft your Message**: Write your message template. You can insert variables using the `{{ColumnName}}` syntax (e.g., `Hi {{Name}}!`).
5. **Map Phone Column**: Select which column in your CSV contains the phone numbers.
6. **Set Anti-Ban Rules**: Configure your minimum and maximum delays, and batch settings.
7. Click **Start**! The extension will automatically open WhatsApp Web tabs and process your queue.

## ⚠️ Disclaimer & Anti-Ban Notice

Sending unsolicited bulk messages violates WhatsApp's Terms of Service. This extension is designed for educational purposes and for contacting people who have opted-in to receive messages from you. 
While this extension employs multiple anti-ban strategies (random delays, personalization, human-like interaction), **your account can still be banned if users report you for spam**. Use this tool responsibly at your own risk.

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
