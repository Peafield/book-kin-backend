# Book Kin Backend

#TODO CLEAN UP!!

## Prepartion
 - Create JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- Create private_key_1:
  ``` bash
  openssl ecparam -name prime256v1 -genkey -noout -out ec_sec1_key.pem
  openssl pkcs8 -topk8 -inform PEM -in ec_sec1_key.pem -outform PEM -nocrypt -out private_key.pem
  cat private_key.pem
  ```

Running locally:

- Start db:
```bash
docker start book-kin-db
```
- start server:
```bash
yarn dev
```
- start ngrok:
```bash
ngrok http 8080
```