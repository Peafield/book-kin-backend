# Book Kin Backend

#TODO CLEAN UP!!

## Prepartion
 - Create JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- Create private_key_1:
  ``` bash
  openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:prime256v1 -out private_key.pem
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