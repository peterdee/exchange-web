## exchange-web

Exchange project allows users to share files using browser on their devices.

Shared files can be protected with a password.

Stack: [Vue](https://vuejs.org), [Socket.IO](https://www.npmjs.com/package/socket.io-client), [Typescript](https://www.typescriptlang.org), [common-styles](https://github.com/julyskies/common-styles)

### Deploy

Clone repository

```shell script
git clone https://github.com/peterdee/exchange-web
cd ./exchange-web
nvm use 18
npm ci
```

Create a `certificates` directory in the project root

```shell script
mkdir certificates && cd certificates
```

Generate certificate files for HTTPS

```shell script
# Generate key file
openssl genrsa -out key.pem 2048

# Generate CSR
openssl req -new -sha256 -key key.pem -out csr.csr

# Generate certificate
openssl req -x509 -sha256 -days 365 -key key.pem -in csr.csr -out cert.pem
```

HTTPS is required for the [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) interface that works only in secure contexts

More details about certificate generating can be found [here](https://msol.io/blog/tech/create-a-self-signed-ssl-certificate-with-openssl)

### Environment variables

The `.env` file is required, see [.env.example](./.env.example) for details

### Launch

```shell script
npm run dev
```

Local WEB application will be available at https://localhost:3000

### License

[MIT](./LICENSE.md)
