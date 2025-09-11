# Layanan Klaim Token Fungible NEAR

Layanan ini menyediakan API sederhana untuk mentransfer Token Fungible (FT) di blockchain NEAR. Dibangun dengan Express.js dan menggunakan pustaka `near-api-js` untuk berinteraksi dengan smart contract NEAR.

## Alur Proyek

Layanan ini bekerja sebagai berikut->

1.  **Inisialisasi**: Saat server dimulai, ia menginisialisasi koneksi ke blockchain NEAR menggunakan kredensial dan konfigurasi jaringan yang ditentukan dalam `src/config.ts`. Ini terhubung ke akun master yang akan digunakan untuk mengirim token.
2.  **Endpoint API**: Layanan ini mengekspos satu endpoint POST di `/send-ft`.
3.  **Penanganan Permintaan**: Ketika permintaan POST diterima di `/send-ft`, layanan mengharapkan body JSON dengan `receiverId` (akun NEAR penerima) dan `amount` (jumlah token yang akan dikirim).
4.  **Interaksi Smart Contract**: Layanan kemudian memanggil metode `ft_transfer` pada smart contract Token Fungible yang ditentukan (`ftContract` dalam konfigurasi), meneruskan `receiverId` dan `amount` dari permintaan.
5.  **Respons**: Layanan merespons dengan pesan konfirmasi dan hasil transaksi dari blockchain NEAR.

## Fungsi yang Digunakan

### `src/near.ts`

-   `initNear()`: Fungsi asinkron ini menginisialisasi koneksi ke blockchain NEAR. Ini mengatur `keyStore`, mengonfigurasi pengaturan koneksi NEAR (ID jaringan, URL node, dll.), dan membuat objek `Account` untuk akun master yang akan digunakan untuk mengirim token. Fungsi ini harus dipanggil sebelum interaksi blockchain lainnya dapat terjadi.
-   `getNear()`: Fungsi ini mengembalikan objek `Account` yang diinisialisasi. Ini akan melemparkan error jika `initNear()` belum dipanggil terlebih dahulu, memastikan bahwa aplikasi tidak mencoba berinteraksi dengan blockchain sebelum koneksi terjalin.

### `src/index.ts`

-   `POST /send-ft`: Ini adalah endpoint API utama. Ini menangani logika untuk mentransfer Token Fungible.
    -   Ini mem-parsing `receiverId` dan `amount` dari body permintaan.
    -   Ini memanggil `getNear()` untuk mendapatkan objek akun master.
    -   Ini menggunakan metode `functionCall` dari objek akun untuk memanggil metode `ft_transfer` pada smart contract FT.
    -   Ini memformat jumlah menggunakan `utils.format.parseNearAmount` untuk mengubahnya ke format yang dibutuhkan oleh smart contract.
    -   Ini mengembalikan respons JSON yang menunjukkan keberhasilan atau kegagalan inisiasi transfer.
-   `startServer()`: Fungsi ini memulai server web Express. Ini pertama-tama memastikan bahwa koneksi NEAR diinisialisasi dengan memanggil `initNear()`. Jika koneksi berhasil, ia mulai mendengarkan permintaan HTTP yang masuk pada port yang dikonfigurasi.

### `src/config.ts`

-   File ini berisi konfigurasi untuk layanan, termasuk:
    -   `networkId`: Jaringan NEAR yang akan dihubungkan (misalnya, "testnet", "mainnet", atau "sandbox").
    -   `nodeUrl`: URL dari node RPC NEAR.
    -   `masterAccount`: Akun NEAR yang akan digunakan untuk mengirim token. **Anda harus mengganti placeholder dengan akun Anda sendiri.**
    -   `ftContract`: Alamat smart contract Token Fungible. **Anda harus mengganti placeholder dengan alamat kontrak FT Anda sendiri.**

## Cara Menjalankan Layanan

1.  **Klon repositori:**
    ```bash
    git clone https://github.com/Psianturi/ft-claim-service.git
    cd ft-claim-service
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi layanan:**
    -   Buka `src/config.ts`.
    -   Ganti `"your-account.testnet"` di `masterAccount` dengan ID akun testnet NEAR Anda yang sebenarnya. Akun ini harus memiliki dana dan FT yang ingin Anda transfer.
    -   Ganti `"ft.examples.testnet"` di `ftContract` dengan ID akun dari kontrak Token Fungible yang ingin Anda ajak berinteraksi.

4.  **Mulai server:**
    ```bash
    npm start
    ```
    Server akan dimulai, dan Anda akan melihat pesan yang mengonfirmasi bahwa server sedang berjalan:
    ```
    🚀 Server is running on http://localhost:3000
    ```

## Cara Menggunakan API

Anda dapat mengirim permintaan POST ke endpoint `/send-ft` untuk mentransfer token.

**Contoh menggunakan `curl`:**

```bash
curl -X POST http://localhost:3000/send-ft \
-H "Content-Type: application/json" \
-d '{
  "receiverId": "recipient-account.testnet",
  "amount": "10"
}'
```

-   Ganti `"recipient-account.testnet"` dengan ID akun NEAR penerima.
-   Ganti `"10"` dengan jumlah token yang ingin Anda kirim.

**Respons Berhasil:**

Jika transfer berhasil diinisiasi, Anda akan menerima respons seperti ini:

```json
{
  "message": "FT transfer initiated successfully",
  "result": {
    ... (detail transaksi dari NEAR)
  }
}
```

Ini menunjukkan bahwa transaksi telah dikirim ke jaringan NEAR untuk diproses.
