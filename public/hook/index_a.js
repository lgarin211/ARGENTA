        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        const modalDialog = document.getElementById('modalDialog');
        const closeModal = document.getElementById('closeModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const readMoreButtons = document.querySelectorAll('.read-more-btn');

        // Fungsi untuk menampilkan modal dengan animasi
        function showModal(title, content) {
            modalTitle.textContent = title;
            modalContent.textContent = content;
            modal.classList.remove('hidden');

            // Trigger animasi masuk
            setTimeout(() => {
                modalDialog.classList.remove('scale-95', 'opacity-0');
                modalDialog.classList.add('scale-100', 'opacity-100');
            }, 10);
        }

        // Fungsi untuk menutup modal dengan animasi
        function hideModal() {
            modalDialog.classList.remove('scale-100', 'opacity-100');
            modalDialog.classList.add('scale-95', 'opacity-0');

            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        // Event listener untuk menutup modal
        closeModal.addEventListener('click', hideModal);
        closeModalBtn.addEventListener('click', hideModal);

        // Tutup modal ketika klik di luar modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });

        // Tutup modal dengan tombol ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                hideModal();
            }
        });

        // Hapus semua deklarasi variabel konten dinamis, ganti dengan variabel global yang akan diisi dari JSON
        let kontenLayanan, kontenKomisarisDirektur, kontenVisiMisi, kontenKoneksiWilayah, kontenPerusahaanDipercaya, kontenTentangKami;

        // Default hero data
        defaultHeroData = {
            background: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1350&q=80",
            overlay: 0.45,
            title: "Senantiasa Membantu",
            subtitle: "Argenta Teknika Intramas siap membantu anda dalam penyediaan kebutuhan bisnis."
        };
        let kontenHero = defaultHeroData;

        // Fungsi helper untuk menangani URL gambar
        function getImageUrl(imagePath) {
            if (!imagePath) return '';
            // Jika sudah memiliki protocol (http/https) atau data URI, return as is
            if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
                return imagePath;
            }
            // Jika path relatif, tambahkan base URL
            return `https://allhub.progesio.my.id/storage/${imagePath}`;
        }

        // Default data fallback
        const defaultData = {
            kontenLayanan: {
                "default": {
                    title: "Layanan Default",
                    desc: "Deskripsi layanan default",
                    image: "default.jpg"
                }
            },
            kontenKomisarisDirektur: {
                komisaris: {
                    nama: "Nama Komisaris",
                    jabatan: "Komisaris",
                    desc: "Deskripsi komisaris",
                    image: "https://via.placeholder.com/300"
                },
                direktur: {
                    nama: "Nama Direktur",
                    jabatan: "Direktur",
                    desc: "Deskripsi direktur",
                    image: "https://via.placeholder.com/300"
                }
            },
            kontenVisiMisi: {
                visi: "Visi default perusahaan",
                misi: ["Misi 1", "Misi 2", "Misi 3"]
            },
            kontenKoneksiWilayah: {
                judul: "Koneksi Wilayah",
                deskripsi: "Deskripsi koneksi wilayah",
                image: "https://via.placeholder.com/600x400"
            },
            kontenPerusahaanDipercaya: {
                judul: "Perusahaan Dipercaya",
                logo: [
                    { nama: "Partner 1", image: null },
                    { nama: "Partner 2", image: null }
                ]
            },
            kontenTentangKami: {
                judul: "Tentang Kami",
                image: "https://via.placeholder.com/600x400",
                paragraf: ["Paragraf tentang kami 1", "Paragraf tentang kami 2"]
            }
        };

        // Fungsi helper untuk mengelola cache di Firebase Realtime Database
        function setCacheToFirebase(name, value, minutes) {
            return new Promise((resolve, reject) => {
                if (typeof firebase === 'undefined' || !firebase.database) {
                    console.warn('Firebase database tidak tersedia, menggunakan localStorage sebagai fallback');
                    // Fallback ke localStorage
                    const cacheData = {
                        data: value,
                        timestamp: Date.now(),
                        expiry: Date.now() + (minutes * 60 * 1000)
                    };
                    localStorage.setItem(name, JSON.stringify(cacheData));
                    resolve();
                    return;
                }

                try {
                    const database = firebase.database();
                    const cacheData = {
                        data: value,
                        timestamp: Date.now(),
                        expiry: Date.now() + (minutes * 60 * 1000)
                    };

                    database.ref('dcrosCache/' + name).set(cacheData)
                        .then(() => {
                            console.log(`Cache ${name} berhasil disimpan ke Firebase`);
                            resolve();
                        })
                        .catch((error) => {
                            console.error('Error menyimpan cache ke Firebase:', error);
                            // Fallback ke localStorage
                            localStorage.setItem(name, JSON.stringify(cacheData));
                            resolve();
                        });
                } catch (error) {
                    console.error('Error mengakses Firebase:', error);
                    // Fallback ke localStorage
                    const cacheData = {
                        data: value,
                        timestamp: Date.now(),
                        expiry: Date.now() + (minutes * 60 * 1000)
                    };
                    localStorage.setItem(name, JSON.stringify(cacheData));
                    resolve();
                }
            });
        }

        function getCacheFromFirebase(name) {
            return new Promise((resolve, reject) => {
                if (typeof firebase === 'undefined' || !firebase.database) {
                    console.warn('Firebase database tidak tersedia, menggunakan localStorage sebagai fallback');
                    // Fallback ke localStorage
                    const cachedData = localStorage.getItem(name);
                    if (cachedData) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            if (Date.now() > parsed.expiry) {
                                localStorage.removeItem(name);
                                resolve(null);
                            } else {
                                resolve(parsed.data);
                            }
                        } catch (e) {
                            localStorage.removeItem(name);
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                    return;
                }

                try {
                    const database = firebase.database();
                    database.ref('dcrosCache/' + name).once('value')
                        .then((snapshot) => {
                            const cacheData = snapshot.val();
                            if (cacheData) {
                                // Cek apakah cache sudah expired
                                if (Date.now() > cacheData.expiry) {
                                    console.log(`Cache ${name} sudah expired, menghapus...`);
                                    database.ref('dcrosCache/' + name).remove();
                                    resolve(null);
                                } else {
                                    console.log(`Cache ${name} ditemukan dan masih valid`);
                                    resolve(cacheData.data);
                                }
                            } else {
                                console.log(`Cache ${name} tidak ditemukan`);
                                resolve(null);
                            }
                        })
                        .catch((error) => {
                            console.error('Error membaca cache dari Firebase:', error);
                            // Fallback ke localStorage
                            const cachedData = localStorage.getItem(name);
                            if (cachedData) {
                                try {
                                    const parsed = JSON.parse(cachedData);
                                    if (Date.now() > parsed.expiry) {
                                        localStorage.removeItem(name);
                                        resolve(null);
                                    } else {
                                        resolve(parsed.data);
                                    }
                                } catch (e) {
                                    localStorage.removeItem(name);
                                    resolve(null);
                                }
                            } else {
                                resolve(null);
                            }
                        });
                } catch (error) {
                    console.error('Error mengakses Firebase:', error);
                    // Fallback ke localStorage
                    const cachedData = localStorage.getItem(name);
                    if (cachedData) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            if (Date.now() > parsed.expiry) {
                                localStorage.removeItem(name);
                                resolve(null);
                            } else {
                                resolve(parsed.data);
                            }
                        } catch (e) {
                            localStorage.removeItem(name);
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                }
            });
        }

        function deleteCacheFromFirebase(name) {
            return new Promise((resolve, reject) => {
                if (typeof firebase === 'undefined' || !firebase.database) {
                    console.warn('Firebase database tidak tersedia, menggunakan localStorage sebagai fallback');
                    localStorage.removeItem(name);
                    resolve();
                    return;
                }

                try {
                    const database = firebase.database();
                    database.ref('dcrosCache/' + name).remove()
                        .then(() => {
                            console.log(`Cache ${name} berhasil dihapus dari Firebase`);
                            // Hapus juga dari localStorage jika ada
                            localStorage.removeItem(name);
                            resolve();
                        })
                        .catch((error) => {
                            console.error('Error menghapus cache dari Firebase:', error);
                            // Hapus dari localStorage sebagai fallback
                            localStorage.removeItem(name);
                            resolve();
                        });
                } catch (error) {
                    console.error('Error mengakses Firebase:', error);
                    localStorage.removeItem(name);
                    resolve();
                }
            });
        }

        // Fungsi untuk load data dari API eksternal dengan caching di Firebase
        async function loadKontenJSON() {
            try {
                // Cek apakah data sudah ada di Firebase cache
                const cachedData = await getCacheFromFirebase('argentaData');

                // Jika data ada di cache dan belum expired (akan otomatis dicek di getCacheFromFirebase)
                if (cachedData) {
                    console.log('Menggunakan data dari cache Firebase');

                    // Assign data dari cache
                    kontenHero = cachedData.kontenHero || defaultHeroData;
                    kontenLayanan = cachedData.kontenLayanan || defaultData.kontenLayanan;

                    if (cachedData.kontenKomisarisDirektur &&
                        (cachedData.kontenKomisarisDirektur.komisaris || cachedData.kontenKomisarisDirektur.direktur)) {
                        kontenKomisarisDirektur = {
                            komisaris: cachedData.kontenKomisarisDirektur.komisaris || null,
                            direktur: cachedData.kontenKomisarisDirektur.direktur || null
                        };
                    } else {
                        kontenKomisarisDirektur = defaultData.kontenKomisarisDirektur;
                    }

                    kontenVisiMisi = cachedData.kontenVisiMisi || defaultData.kontenVisiMisi;
                    kontenKoneksiWilayah = cachedData.kontenKoneksiWilayah || defaultData.kontenKoneksiWilayah;

                    if (cachedData.kontenPerusahaanDipercaya) {
                        kontenPerusahaanDipercaya = {
                            judul: cachedData.kontenPerusahaanDipercaya.judul || defaultData.kontenPerusahaanDipercaya.judul,
                            logo: cachedData.kontenPerusahaanDipercaya.logo || null
                        };
                    } else {
                        kontenPerusahaanDipercaya = defaultData.kontenPerusahaanDipercaya;
                    }

                    kontenTentangKami = cachedData.kontenTentangKami || defaultData.kontenTentangKami;

                    return; // Keluar dari fungsi karena menggunakan cache
                }

                // Jika tidak ada cache atau sudah expired, hit ke server
                console.log('Mengambil data dari server API');
                const res = await fetch('https://allhub.progesio.my.id/api/hub/argenta/index');
                if (!res.ok) throw new Error('Gagal memuat data dari API');

                const response = await res.json();

                // Validasi struktur response
                if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
                    throw new Error('Format response API tidak valid');
                }

                const data = response.data[0]; // Ambil data pertama dari array

                // Assign data dengan fallback ke default jika tidak ada atau null
                kontenHero = data.kontenHero || defaultHeroData;
                kontenLayanan = data.kontenLayanan || defaultData.kontenLayanan;

                // Handle null values untuk komisaris dan direktur
                if (data.kontenKomisarisDirektur &&
                    (data.kontenKomisarisDirektur.komisaris || data.kontenKomisarisDirektur.direktur)) {
                    kontenKomisarisDirektur = {
                        komisaris: data.kontenKomisarisDirektur.komisaris || null,
                        direktur: data.kontenKomisarisDirektur.direktur || null
                    };
                } else {
                    kontenKomisarisDirektur = defaultData.kontenKomisarisDirektur;
                }

                kontenVisiMisi = data.kontenVisiMisi || defaultData.kontenVisiMisi;
                kontenKoneksiWilayah = data.kontenKoneksiWilayah || defaultData.kontenKoneksiWilayah;

                // Handle null values untuk logo perusahaan
                if (data.kontenPerusahaanDipercaya) {
                    kontenPerusahaanDipercaya = {
                        judul: data.kontenPerusahaanDipercaya.judul || defaultData.kontenPerusahaanDipercaya.judul,
                        logo: data.kontenPerusahaanDipercaya.logo || null
                    };
                } else {
                    kontenPerusahaanDipercaya = defaultData.kontenPerusahaanDipercaya;
                }

                kontenTentangKami = data.kontenTentangKami || defaultData.kontenTentangKami;

                // Simpan data ke Firebase cache selama 1 menit
                await setCacheToFirebase('argentaData', data, 1);

                console.log('Data berhasil dimuat dari API dan disimpan ke Firebase cache:', data);

            } catch (e) {
                console.error('Error loading API data:', e);

                // Hapus cache jika ada error
                await deleteCacheFromFirebase('argentaData');

                // Fallback ke data default jika API gagal
                kontenLayanan = defaultData.kontenLayanan;
                kontenKomisarisDirektur = defaultData.kontenKomisarisDirektur;
                kontenVisiMisi = defaultData.kontenVisiMisi;
                kontenKoneksiWilayah = defaultData.kontenKoneksiWilayah;
                kontenPerusahaanDipercaya = defaultData.kontenPerusahaanDipercaya;
                kontenTentangKami = defaultData.kontenTentangKami;

                alert('Gagal memuat konten dari server, menggunakan konten default!');
            }
        }

        // Fungsi untuk menghapus cache manual (bisa dipanggil dari console untuk testing)
        async function clearCache() {
            await deleteCacheFromFirebase('argentaData');
            console.log('Cache data Argenta berhasil dihapus dari Firebase');
        }

        // Fungsi untuk cek status cache (bisa dipanggil dari console untuk testing)
        async function checkCache() {
            try {
                const cachedData = await getCacheFromFirebase('argentaData');

                if (cachedData) {
                    console.log('Cache tersedia di Firebase');
                    return {
                        hasCache: true,
                        data: cachedData
                    };
                } else {
                    console.log('Tidak ada cache tersedia di Firebase');
                    return { hasCache: false };
                }
            } catch (error) {
                console.error('Error mengecek cache:', error);
                return { hasCache: false, error: error.message };
            }
        }

        // Fungsi untuk membersihkan semua cache expired di Firebase (maintenance)
        async function cleanExpiredCache() {
            if (typeof firebase === 'undefined' || !firebase.database) {
                console.warn('Firebase database tidak tersedia');
                return;
            }

            try {
                const database = firebase.database();
                const snapshot = await database.ref('dcrosCache').once('value');
                const allCache = snapshot.val();

                if (allCache) {
                    const now = Date.now();
                    const expiredKeys = [];

                    Object.keys(allCache).forEach(key => {
                        if (allCache[key].expiry && now > allCache[key].expiry) {
                            expiredKeys.push(key);
                        }
                    });

                    // Hapus cache yang expired
                    const deletePromises = expiredKeys.map(key =>
                        database.ref('dcrosCache/' + key).remove()
                    );

                    await Promise.all(deletePromises);
                    console.log(`Berhasil menghapus ${expiredKeys.length} cache expired dari Firebase`);
                } else {
                    console.log('Tidak ada cache di Firebase');
                }
            } catch (error) {
                console.error('Error membersihkan cache expired:', error);
            }
        }

        // Fungsi untuk monitoring penggunaan cache (debugging)
        async function getCacheStats() {
            if (typeof firebase === 'undefined' || !firebase.database) {
                console.warn('Firebase database tidak tersedia');
                return { error: 'Firebase tidak tersedia' };
            }

            try {
                const database = firebase.database();
                const snapshot = await database.ref('dcrosCache').once('value');
                const allCache = snapshot.val();

                if (!allCache) {
                    return {
                        totalCache: 0,
                        activeCache: 0,
                        expiredCache: 0,
                        cacheList: []
                    };
                }

                const now = Date.now();
                let activeCount = 0;
                let expiredCount = 0;
                const cacheList = [];

                Object.keys(allCache).forEach(key => {
                    const cache = allCache[key];
                    const isExpired = cache.expiry && now > cache.expiry;

                    if (isExpired) {
                        expiredCount++;
                    } else {
                        activeCount++;
                    }

                    cacheList.push({
                        key: key,
                        created: new Date(cache.timestamp).toLocaleString(),
                        expires: new Date(cache.expiry).toLocaleString(),
                        isExpired: isExpired,
                        timeLeft: isExpired ? 0 : Math.floor((cache.expiry - now) / 1000) + ' detik'
                    });
                });

                return {
                    totalCache: Object.keys(allCache).length,
                    activeCache: activeCount,
                    expiredCache: expiredCount,
                    cacheList: cacheList
                };
            } catch (error) {
                console.error('Error mendapatkan statistik cache:', error);
                return { error: error.message };
            }
        }

        // Hamburger menu logic
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        function showMenu() {
            navMenu.classList.remove('opacity-0', 'invisible', 'hidden');
            navMenu.classList.add('opacity-100', 'visible');
        }
        function hideMenu() {
            navMenu.classList.remove('opacity-100', 'visible');
            navMenu.classList.add('opacity-0', 'invisible', 'hidden');
        }
        hamburger.addEventListener('click', () => {
            const isOpen = navMenu.classList.contains('opacity-100');
            if (isOpen) {
                hideMenu();
            } else {
                showMenu();
            }
        });
        // Close menu on link click (mobile)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    hideMenu();
                }
            });
        });
        // Responsive fix on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                navMenu.classList.remove('opacity-0', 'invisible', 'hidden', 'flex-col', 'items-center', 'justify-center', 'space-y-8');
                navMenu.classList.add('opacity-100', 'visible', 'flex', 'flex-row', 'space-x-8');
            } else {
                hideMenu();
                navMenu.classList.remove('flex-row', 'space-x-8');
                navMenu.classList.add('flex-col', 'items-center', 'justify-center', 'space-y-8');
            }
        });
        // Initial state
        if (window.innerWidth >= 768) {
            navMenu.classList.remove('opacity-0', 'invisible', 'hidden', 'flex-col', 'items-center', 'justify-center', 'space-y-8');
            navMenu.classList.add('opacity-100', 'visible', 'flex', 'flex-row', 'space-x-8');
        } else {
            hideMenu();
            navMenu.classList.remove('flex-row', 'space-x-8');
            navMenu.classList.add('flex-col', 'items-center', 'justify-center', 'space-y-8');
        }
        // Render konten dinamis ke section
        function renderHero() {
            const el = document.getElementById('hero-section');
            // Jika kontenHero adalah array, render carousel, jika bukan, render satu slide
            let slides = Array.isArray(kontenHero) ? kontenHero : [kontenHero];
            el.innerHTML = `
        <div class="owl-carousel hero-carousel">
          ${slides.map(hero => `
            <section class=\"relative h-[80vh] flex items-center justify-center text-center px-4 mt-16 bg-cover bg-center\" style=\"background-image: url('${getImageUrl(hero.background)}');\">
              <div class=\"absolute inset-0 bg-black\" style=\"opacity: ${hero.overlay};\"></div>
              <div class=\"relative max-w-xl text-white\">
                <h1 class=\"text-4xl md:text-5xl font-extrabold mb-4\">${hero.title}</h1>
                <div class=\"text-lg md:text-xl font-normal\">${hero.subtitle}</div>
              </div>
            </section>
          `).join('')}
        </div>
      `;
        }
        function renderVisiMisi() {
            const visiMisi = document.getElementById('visi-misi');
            visiMisi.innerHTML = `
        <h2 class="text-3xl font-bold mb-8 tracking-widest">VISI & MISI</h2>
        <div class="flex flex-col md:flex-row justify-center gap-12 max-w-5xl mx-auto text-left">
          <div class="md:w-1/2">
            <h3 class="text-xl font-semibold mb-4 tracking-wide">Visi</h3>
            <p class="text-base leading-relaxed whitespace-pre-line">${kontenVisiMisi.visi}</p>
          </div>
          <div class="md:w-1/2">
            <h3 class="text-xl font-semibold mb-4 tracking-wide">Misi</h3>
            <ol class="list-decimal list-inside space-y-2 text-base leading-relaxed">
              ${kontenVisiMisi.misi.map(m => `<li>${m}</li>`).join('')}
            </ol>
          </div>
        </div>
      `;
        }
        function renderKomisarisDirektur() {
            const el = document.getElementById('komisaris-direktur');

            // Cek apakah data komisaris dan direktur ada dan tidak null
            if (!kontenKomisarisDirektur ||
                (!kontenKomisarisDirektur.komisaris && !kontenKomisarisDirektur.direktur)) {
                el.innerHTML = `
          <div class="container mx-auto px-4 text-center">
            <h2 class="text-3xl font-bold mb-8 tracking-widest">KOMISARIS DAN DIREKTUR</h2>
            <p class="text-lg">Data komisaris dan direktur sedang tidak tersedia.</p>
          </div>
        `;
                return;
            }

            el.innerHTML = `
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-8 tracking-widest">KOMISARIS DAN DIREKTUR</h2>
          <div class="flex flex-col md:flex-row justify-center gap-16 max-w-5xl mx-auto text-center">
            
            ${kontenKomisarisDirektur.direktur ? `
            <div class="md:w-1/2">
              <h3 class="text-4xl font-normal mb-2">Direktur</h3>
              <div class="h-3 w-3/4 bg-red-900 mx-auto mb-6"></div>
              <div class="relative group mx-auto w-72 h-72 rounded overflow-hidden shadow-lg">
                <img src="${getImageUrl(kontenKomisarisDirektur.direktur.image)}" alt="Direktur" class="object-cover w-full h-full grayscale group-hover:grayscale-0 transition duration-300 group-hover:scale-125" />
                <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-900/90 to-transparent p-4 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="text-lg font-bold text-white">${kontenKomisarisDirektur.direktur.nama}</div>
                  <div class="text-sm text-white">${kontenKomisarisDirektur.direktur.jabatan}</div>
                  <div class="text-xs text-white mt-1">${kontenKomisarisDirektur.direktur.desc}</div>
                </div>
              </div>
            </div>
            ` : ''}

            ${kontenKomisarisDirektur.komisaris ? `
            <div class="md:w-1/2">
              <h3 class="text-4xl font-normal mb-2">Komisaris</h3>
              <div class="h-3 w-3/4 bg-red-900 mx-auto mb-6"></div>
              <div class="relative group mx-auto w-72 h-72 rounded overflow-hidden shadow-lg">
                <img src="${getImageUrl(kontenKomisarisDirektur.komisaris.image)}" alt="Komisaris" class="object-cover w-full h-full grayscale group-hover:grayscale-0 transition duration-300 group-hover:scale-125" />
                <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-900/90 to-transparent p-4 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="text-lg font-bold text-white">${kontenKomisarisDirektur.komisaris.nama}</div>
                  <div class="text-sm text-white">${kontenKomisarisDirektur.komisaris.jabatan}</div>
                  <div class="text-xs text-white mt-1">${kontenKomisarisDirektur.komisaris.desc}</div>
                </div>
              </div>
            </div>
            ` : ''}

          </div>
        </div>
      `;
        }
        function renderKoneksiWilayah() {
            const el = document.getElementById('koneksi-wilayah');
            el.innerHTML = `
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold mb-4 tracking-widest">${kontenKoneksiWilayah.judul}</h2>
          <p class="mb-8 max-w-2xl mx-auto">${kontenKoneksiWilayah.deskripsi}</p>
          <div class="w-full h-96 md:h-[700px] lg:h-[800px] rounded-lg overflow-hidden shadow-2xl border border-red-700">
            <iframe 
              src="./dector/Neo.html" 
              width="100%" 
              height="100%" 
              frameborder="0" 
              allowfullscreen
              title="Peta Koneksi Wilayah"
              class="w-full h-full">
            </iframe>
          </div>
        </div>
      `;
        }
        function renderLayanan() {
            const el = document.getElementById('layanan');

            console.log('Rendering layanan with kontenLayanan:', kontenLayanan);
            el.innerHTML = `
        <div class="container mx-auto px-4" id="layanan">
          <h2 class="text-3xl font-bold mb-8 tracking-widest text-center">LAYANAN KAMI</h2>
          <div class="owl-carousel layanan-carousel">
            ${Object.values(kontenLayanan).map((l, index) => `
              <div class="bg-white text-black rounded-lg shadow-lg grayscale hover:grayscale-0 transition duration-300 ease-in-out overflow-hidden">
                ${l.image ? `
                <div class="h-48 w-full bg-gray-200 overflow-hidden">
                  <img src="${getImageUrl(l.image)}" alt="${l.title}" class="w-full h-full object-cover" />
                </div>
                ` : ''}
                <div class="p-6 flex flex-col h-full">
                  <div class="flex items-start mb-4">
                    <div class="w-12 h-12 bg-red-900 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                    <h3 class="font-bold uppercase text-lg leading-tight">${l.title}</h3>
                  </div>
                  <p class="text-sm text-gray-600 mb-6 flex-grow leading-relaxed">
                    ${l.desc && l.desc.length > 100 ? l.desc.substring(0, 100) + '...' : l.desc}
                  </p>
                  ${l.desc && l.desc.length > 100 ? `
                  <button class="read-more-btn self-start bg-red-900 text-white px-4 py-2 rounded hover:bg-red-700 transition flex items-center gap-2" 
                          data-title="${l.title}" data-index="${index}">
                    Read More
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                  </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

            // Tambahkan event listener untuk tombol read more setelah render
            setTimeout(() => {
                document.querySelectorAll('.read-more-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const title = this.getAttribute('data-title');
                        const index = parseInt(this.getAttribute('data-index'));
                        const layananArray = Object.values(kontenLayanan);
                        const desc = layananArray[index] ? layananArray[index].desc : '';
                        showModal(title, desc);
                    });
                });
            }, 100);
        }
        function renderPerusahaanDipercaya() {
            const el = document.getElementById('perusahaan-dipercaya');

            // Cek apakah data logo ada dan tidak null
            if (!kontenPerusahaanDipercaya || !kontenPerusahaanDipercaya.logo) {
                el.innerHTML = `
          <div class="container mx-auto px-4 text-center text-white max-w-6xl">
            <h2 class="text-3xl font-extrabold mb-8 tracking-widest">
              ${kontenPerusahaanDipercaya?.judul || 'Perusahaan Dipercaya'}
            </h2>
            <p class="text-lg">Data perusahaan mitra sedang tidak tersedia.</p>
          </div>
        `;
                return;
            }

            el.innerHTML = `
        <div class="container mx-auto px-4 text-center text-white max-w-6xl">
          <h2 class="text-3xl font-extrabold mb-8 tracking-widest">
            <span class="font-extrabold">${kontenPerusahaanDipercaya.judul.split(' ')[0]}</span> ${kontenPerusahaanDipercaya.judul.split(' ').slice(1).join(' ')}
          </h2>
          <div class="owl-carousel owl-theme mb-8">
            ${kontenPerusahaanDipercaya.logo.map(l => `
              <div class="flex items-center justify-center rounded-full h-20 w-40 mx-auto" style="width: inherit;">
                ${l.image ? `<img src="${getImageUrl(l.image)}" alt="${l.nama}" class="h-12 object-contain"  />` : `<span class="text-red-900 font-bold text-lg">${l.nama}</span>`}
              </div>
            `).join('')}
          </div>
        </div>
      `;
        }
        function renderTentangKami() {
            const el = document.getElementById('tentang-kami');
            el.innerHTML = `
        <div class=\"md:w-1/2 relative\">
          <img src=\"${getImageUrl(kontenTentangKami.image)}\" alt=\"Meeting room\" class=\"w-full h-full object-cover\" />
          <div class=\"absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-red-900/90 to-transparent\"></div>
        </div>
        <div class=\"md:w-1/2 p-8 flex flex-col justify-center text-white\">
          <h2 class=\"text-3xl font-bold mb-4 tracking-wide\">${kontenTentangKami.judul}</h2>
          ${kontenTentangKami.paragraf.map(p => `<p class=\"mb-4 text-base leading-relaxed\">${p}</p>`).join('')}
        </div>
      `;
        }
        // Loading overlay logic
        function showLoading() {
            document.getElementById('page-loading').style.opacity = '1';
            document.getElementById('page-loading').style.pointerEvents = 'auto';
        }
        function hideLoading() {
            document.getElementById('page-loading').style.opacity = '0';
            document.getElementById('page-loading').style.pointerEvents = 'none';
            setTimeout(() => {
                document.getElementById('page-loading').style.display = 'none';
            }, 400);
        }
        // Show loading on menu click
        document.addEventListener('DOMContentLoaded', async function () {
            // Bersihkan cache expired di background
            setTimeout(() => {
                cleanExpiredCache();
            }, 2000);

            await loadKontenJSON();
            renderHero();
            renderVisiMisi();
            renderKomisarisDirektur();
            renderKoneksiWilayah();
            renderLayanan();
            renderPerusahaanDipercaya();
            renderTentangKami();
            // Inisialisasi ulang Owl Carousel setelah render
            setTimeout(function () {
                $('.layanan-carousel').owlCarousel({
                    loop: true,
                    margin: 24,
                    nav: false,
                    dots: true,
                    responsive: {
                        0: { items: 1 },
                        600: { items: 2 },
                        1000: { items: 3 }
                    }
                });
                $('.hero-carousel').owlCarousel({
                    items: 1,
                    loop: true,
                    nav: false,
                    dots: true,
                    autoplay: true,
                    autoplayTimeout: 5000,
                    animateOut: 'fadeOut',
                    animateIn: 'fadeIn',
                    smartSpeed: 800
                });
                $('.owl-carousel.owl-theme').owlCarousel({
                    loop: true,
                    margin: 24,
                    nav: false,
                    dots: true,
                    responsive: {
                        0: { items: 1 },
                        600: { items: 2 },
                        1000: { items: 3 }
                    }
                });
            }, 100);
            document.querySelectorAll('#navMenu a').forEach(link => {
                link.addEventListener('click', function (e) {
                    const href = link.getAttribute('href');
                    if (href && href !== '#' && !href.startsWith('javascript:')) {
                        showLoading();
                    }
                });
            });
            // Hide loading after page load
            window.addEventListener('load', hideLoading);
            setTimeout(hideLoading, 2000); // Fallback hide

            // Firebase SDK initialization and detection
            try {
                // Wait for Firebase to load
                const waitForFirebase = () => {
                    if (typeof firebase !== 'undefined') {
                        let app = firebase.app();
                        let features = [
                            'auth',
                            'database',
                            'firestore',
                            'functions',
                            'messaging',
                            'storage',
                            'analytics',
                            'remoteConfig',
                            'performance',
                        ].filter(feature => typeof app[feature] === 'function');
                        console.log(`Firebase SDK loaded with ${features.join(', ')}`);

                        // Initialize analytics if available
                        if (typeof firebase.analytics === 'function') {
                            firebase.analytics();
                        }

                        // Initialize performance monitoring if available
                        if (typeof firebase.performance === 'function') {
                            firebase.performance();
                        }

                        // Log Firebase Database connection status
                        if (typeof firebase.database === 'function') {
                            const database = firebase.database();
                            database.ref('.info/connected').on('value', (snapshot) => {
                                if (snapshot.val() === true) {
                                    console.log('Firebase Realtime Database terhubung');
                                } else {
                                    console.log('Firebase Realtime Database terputus');
                                }
                            });
                        }
                    } else {
                        console.log('Firebase SDK not yet loaded, retrying...');
                        setTimeout(waitForFirebase, 100);
                    }
                };

                // Start checking for Firebase after a short delay
                setTimeout(waitForFirebase, 500);
            } catch (e) {
                console.error('Error loading the Firebase SDK:', e);
            }
        });