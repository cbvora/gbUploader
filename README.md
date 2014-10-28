gbUploader
==========
There is a heavy file say 1GB or more which user is uploading from browser. 
gbUploader breaks this file into packets of 1MB each and sends to server 
where there is a agent which stablishes handshaking with client for each packet. 
At the end when server receives all the packets. 
It merges and regenrates the file. 
and notifies the client about success.
