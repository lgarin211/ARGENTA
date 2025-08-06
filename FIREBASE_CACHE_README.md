# Firebase Cache System Documentation

## Overview
Sistem caching ini menggunakan Firebase Realtime Database untuk menyimpan cache data dengan nama `dcrosCache` dan setting expired 1 menit.

## Fitur
- ✅ Cache data ke Firebase Realtime Database
- ✅ Auto-expire setelah 1 menit
- ✅ Fallback ke localStorage jika Firebase tidak tersedia
- ✅ Auto-cleanup cache expired
- ✅ Console utilities untuk debugging

## Struktur Data di Firebase
```
dcrosCache/
├── argentaData/
│   ├── data: {object} - Data yang di-cache
│   ├── timestamp: {number} - Waktu cache dibuat
│   └── expiry: {number} - Waktu expired cache
```

## Fungsi Cache

### `setCacheToFirebase(name, value, minutes)`
Menyimpan data ke Firebase cache dengan expired time.
```javascript
await setCacheToFirebase('argentaData', data, 1); // Cache selama 1 menit
```

### `getCacheFromFirebase(name)`
Mengambil data dari Firebase cache, otomatis cek expired.
```javascript
const cachedData = await getCacheFromFirebase('argentaData');
```

### `deleteCacheFromFirebase(name)`
Menghapus data cache dari Firebase.
```javascript
await deleteCacheFromFirebase('argentaData');
```

### `getCacheStats()`

Mendapatkan statistik penggunaan cache untuk monitoring.

```javascript
const stats = await getCacheStats();
console.log(stats);
// Output: { totalCache: 2, activeCache: 1, expiredCache: 1, cacheList: [...] }
```

## Console Utilities

### `clearCache()`

Menghapus semua cache Argenta dari Firebase.

```javascript
await clearCache();
```

### `checkCache()`

Mengecek status cache yang tersedia.

```javascript
await checkCache();
```

### `cleanExpiredCache()`

Membersihkan semua cache yang sudah expired (maintenance).

```javascript
await cleanExpiredCache();
```

## Fallback System

Jika Firebase tidak tersedia, sistem akan otomatis fallback ke localStorage dengan struktur yang sama.

## Firebase Rules

File `database.rules.json` berisi aturan security untuk `dcrosCache`:

- Read/Write: Public access
- Validation: Memastikan struktur data cache benar

## Auto-Cleanup

Sistem akan otomatis membersihkan cache expired di background setiap kali halaman dimuat (dengan delay 2 detik).

## Testing

Gunakan browser console untuk testing:

```javascript
// Cek status cache
await checkCache();

// Hapus cache manual
await clearCache();

// Bersihkan cache expired
await cleanExpiredCache();

// Lihat statistik cache
await getCacheStats();
```
