Please replace these cert files with your own.

```bash
$ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
Generating a 2048 bit RSA private key
................................................................................+++
.................................................................................+++
writing new private key to 'key.pem'
Enter PEM pass phrase:
Verifying - Enter PEM pass phrase:
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:CA
State or Province Name (full name) [Some-State]:Alberta
Locality Name (eg, city) []:Edmonton
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Udia Software Incorporated
Organizational Unit Name (eg, section) []:Udia
Common Name (e.g. server FQDN or YOUR name) []:www.udia.ca
Email Address []:admin@udia.ca

# Removing the pass phrase on key.pem
$ openssl rsa -in key.pem -out newkey.pem && mv newkey.pem key.pem
Enter pass phrase for key.pem:
writing RSA key
```
