const dgram = require('dgram'); // Datagram Sockets module for UDP [cite: 1034]
const lora_packet = require('lora-packet'); // Library required to decode Base64 data [cite: 1036]

// Define your local UDP server port and keys
const PORT = 1700; // Standard LoRa packet forwarder port
const HOST = '0.0.0.0';

// Keys must be unique to your specific RN2483 motes configured via ABP [cite: 1041, 1043]
// Replace these with the actual keys from your TTN device registration [cite: 950]
const NwkSKey = Buffer.from('C607076AE48B194841616720DA96D43C', 'hex'); 
const AppSKey = Buffer.from('B3094823A40A3B79612FCA7A0BB17BF4', 'hex'); 

// Create a server using UDP datagram sockets [cite: 1035]
const server = dgram.createSocket('udp4');

server.on('listening', () => {
    const address = server.address();
    console.log(`UDP Server listening on ${address.address}:${address.port} [cite: 1045]`);
});

server.on('message', (message, remote) => {
    console.log(`\nRECEIVED ${message.length} bytes from ${remote.address}:${remote.port}`);
    
    try {
        // The data arrives in a JSON wrapper containing the Base64 payload [cite: 445, 453]
        const messageString = message.toString();
        
        // Basic extraction of the base64 "data" field from the packet forwarder JSON wrapper
        const dataMatch = messageString.match(/"data":\s*"([^"]+)"/);
        
        if (dataMatch && dataMatch[1]) {
            const base64Data = dataMatch[1];
            const packetBuffer = Buffer.from(base64Data, 'base64');
            
            // Parse and generate a packet structure (radio PHYPayload) [cite: 1038, 1058]
            const packet = lora_packet.fromWire(packetBuffer);
            
            console.log("Message Type = " + packet.getType() + " [cite: 1063]");
            console.log("DevAddr = " + packet.getBuffers().DevAddr.toString('hex') + " [cite: 1060]");
            console.log("FCnt = " + packet.getFCnt() + " [cite: 1066]");
            
            // Verify the Message Integrity Code (MIC) [cite: 1042, 1069]
            const isMicValid = lora_packet.verifyMIC(packet, NwkSKey);
            console.log("MIC check = " + (isMicValid ? "OK" : "FAIL"));
            
            if (isMicValid) {
                // Decrypt the payload into a buffer [cite: 1077]
                const decryptedBuffer = lora_packet.decrypt(packet, AppSKey, NwkSKey);
                
                // Print in HEX [cite: 622, 1044]
                console.log("Decrypted (hex) = '0x" + decryptedBuffer.toString('hex') + "'");
                
                // Print in ASCII text [cite: 621, 964, 1044]
                console.log("Decrypted (ASCII) = '" + decryptedBuffer.toString('ascii') + "'");
            }
        }
    } catch (error) {
        console.error("Error processing packet:", error.message);
    }
});

// Bind server to specific port [cite: 1046]
server.bind(PORT, HOST);
