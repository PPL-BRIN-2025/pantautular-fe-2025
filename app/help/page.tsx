"use client";

import HelpTitle from "../components/help/HelpTitle"
import HelpSection from "../components/help/HelpSection"
import HelpFinalSection from "../components/help/HelpFinalSection"
import Navbar from "../components/Navbar"
import GlossarySection from "../components/help/GlossarySection"
import GlossaryItem from "../components/help/GlossaryItem"
import {useAuth} from "../auth/hooks/useAuth";

export default function BantuanPantauTular() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-6 md:px-16 lg:px-24">
        <HelpTitle />
        <div className="mt-10 md:mt-12">
          <HelpSection
            title="1. Pencarian Berdasarkan Nama Penyakit"
            description={`Pengguna dapat memasukkan nama penyakit yang ingin dicari di kotak
            pencarian. Hasil akan menampilkan semua informasi terkait penyakit
            tersebut, termasuk lokasi, tanggal kejadian, dan sumber berita
            terbaru.`}
            imageSrc="/help/pt-3.png"
            imageAlt="Pencarian berdasarkan penyakit"
          />
        </div>

        <div className="mt-10 md:mt-16">
          <HelpSection
            title="2. Pencarian Berdasarkan Lokasi"
            description={`Untuk mencari informasi berdasarkan lokasi, pengguna dapat memilih wilayah
            atau masukkan nama tempat tertentu. Hasil pencarian akan menampilkan penyakit 
            yang terdeteksi di lokasi tersebut beserta detail lainnya.`}
            imageSrc="/help/pt-4.png"
            imageAlt="Pencarian berdasarkan lokasi"
          />
        </div>

        <div className="mt-10 md:mt-16">
          <HelpSection
            title="3. Pencarian Berdasarkan Sumber Berita"
            description={`Pengguna dapat memilih untuk mencari berdasarkan sumber berita tertentu, 
            seperti situs berita atau lembaga kesehatan. Hasil pencarian akan menampilkan 
            informasi penyakit yang terkait dengan sumber berita yang dipilih.`}
            imageSrc="/help/pt-5.png"
            imageAlt="Pencarian berdasarkan sumber berita"
          />
        </div>

        <div className="mt-10 md:mt-16">
          <HelpSection
            title="4. Pencarian Berdasarkan Tingkat Kewaspadaan"
            description={`Pengguna dapat memilih tingkat kewaspadaan berdasarkan bintang yang 
            menggambarkan urutan potensi tertular. Hasil pencarian akan menampilkan
            penyakit dengan tingkat kewaspadaan sesuai dengan pilihan pengguna.`}
            imageSrc="/help/pt-6.png"
            imageAlt="Pencarian berdasarkan tingkat kewaspadaan"
          />
        </div>

        <div className="mt-10 md:mt-16">
          <HelpSection
            title="5. Pencarian Berdasarkan Tanggal Kejadian"
            description={`Untuk melihat informasi terkini atau masa lalu, pengguna dapat memilih 
            rentang tanggal kejadian tertentu. Platform akan menampilkan penyakit yang
            terdeteksi dalam rentang waktu tersebut.`}
            imageSrc="/help/pt-7.png"
            imageAlt="Pencarian berdasarkan tanggal"
          />
        </div>

        <HelpFinalSection />
        
        {isLoggedIn && (
          <div className="mt-16 md:mt-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center">Glosarium PantauTular</h2>

          <GlossarySection title="Curah Hujan">
            <p className="text-gray-700 mb-4">
              Kategori curah hujan dapat menjadi faktor penting dalam penyebaran penyakit menular karena iklim dan
              kondisi lingkungan yang terkait dengan curah hujan dapat memengaruhi habitat vektor penyakit dan kondisi
              lingkungan yang mendukung reproduksi dan penyebaran agen penyakit. Di bawah ini adalah cara berbagai pola
              curah hujan dapat memengaruhi penyebaran penyakit menular.
            </p>

            <GlossaryItem
              number="1"
              title="Lokal"
              items={[
                "Curah hujan lokal sering terjadi secara terbatas di area tertentu.",
                "Pola curah hujan lokal dapat memengaruhi penyebaran penyakit menular lokal yang terkait dengan kondisi lingkungan di wilayah tersebut. Misalnya, peningkatan curah hujan lokal dapat menyebabkan genangan air yang berpotensi menjadi tempat berkembang biak bagi nyamuk pembawa penyakit seperti malaria atau demam berdarah.",
              ]}
            />

            <GlossaryItem
              number="2"
              title="Multipattern"
              items={[
                "Pola curah hujan yang beragam terjadi di wilayah ini, termasuk curah hujan lokal yang terkadang intens.",
                "Penyebaran penyakit menular di daerah dengan pola curah hujan multipattern dapat dipengaruhi oleh berbagai faktor lingkungan dan iklim yang kompleks, yang dapat menciptakan kondisi yang berbeda-beda untuk vektor dan agen penyakit.",
              ]}
            />

            <GlossaryItem
              number="3"
              title="Monsoon"
              items={[
                "Curah hujan musiman yang kuat dan teratur terjadi di musim hujan.",
                "Penyebaran penyakit menular di daerah dengan pola curah hujan monsoon dapat dipengaruhi oleh peningkatan genangan air, kelembaban tinggi, dan kondisi lingkungan yang mendukung perkembangbiakan vektor penyakit seperti nyamuk. Ini dapat meningkatkan risiko penyakit menular yang terkait dengan vektor seperti malaria, demam berdarah, dan demam chikungunya.",
              ]}
            />

            <GlossaryItem
              number="4"
              title="Equatorial"
              items={[
                "Curah hujan tinggi dan merata sepanjang tahun.",
                "Wilayah dengan pola curah hujan equatorial cenderung memiliki kondisi lingkungan yang mendukung reproduksi vektor penyakit sepanjang tahun. Ini dapat meningkatkan risiko penyakit menular seperti malaria, demam berdarah, dan penyakit yang ditularkan melalui air seperti kolera dan diare.",
              ]}
            />

            <GlossaryItem
              number="5"
              title="Lainnya"
              items={[
                "Wilayah dengan pola curah hujan yang tidak termasuk dalam kategori di atas.",
                "Penyebaran penyakit menular di wilayah dengan pola curah hujan yang tidak biasa dapat dipengaruhi oleh kondisi lingkungan lokal dan faktor-faktor iklim yang unik untuk wilayah tersebut. Ini dapat mencakup risiko penyakit menular yang berbeda tergantung pada kondisi spesifik lingkungan tersebut.",
              ]}
            />
          </GlossarySection>

          <GlossarySection title="Hospitalisasi">
            <p className="text-gray-700 mb-4">
              Hospitalisasi merupakan proses dimana seseorang harus dirawat di rumah sakit karena kondisi kesehatan yang
              memerlukan perawatan medis yang intensif atau observasi yang lebih lanjut. Hospitalisasi dapat menjadi
              indikator penting dalam pemantauan penyakit menular karena dapat mencerminkan tingkat keparahan penyakit
              dan dampaknya pada populasi.
            </p>
          </GlossarySection>

          <GlossarySection title="Insiden">
            <p className="text-gray-700 mb-4">
              Insiden merujuk pada jumlah kasus baru suatu penyakit yang terjadi dalam populasi tertentu selama periode
              waktu tertentu. Insiden sering diukur dalam bentuk laju insiden, yaitu jumlah kasus baru penyakit per
              seribu atau per seratus ribu orang dalam populasi pada suatu periode waktu tertentu.
            </p>
          </GlossarySection>

          <GlossarySection title="Kepadatan Penduduk">
            <p className="text-gray-700 mb-4">
              Kepadatan penduduk yang berbeda dapat memengaruhi penyebaran penyakit menular karena meningkatkan
              interaksi antara individu dan potensi kontak dengan agen penyakit. Di bawah ini adalah cara kisaran
              kepadatan penduduk tersebut dapat dikaitkan dengan konteks penyebaran penyakit menular:
            </p>

            <GlossaryItem
              number="1"
              title=">1.299 orang per km²"
              items={[
                "Kepadatan penduduk tinggi, cenderung di kota besar atau pusat perkotaan padat.",
                "Interaksi antar individu sangat tinggi, meningkatkan risiko penyebaran penyakit menular seperti influenza, demam berdarah, dan infeksi saluran pernapasan.",
              ]}
            />

            <GlossaryItem
              number="2"
              title="1500 - 2000 orang per km²"
              items={[
                "Kepadatan penduduk sangat tinggi, biasanya di kota metropolitan besar.",
                "Potensi penyebaran penyakit menular dengan cepat dan luas karena tingginya interaksi antar individu.",
              ]}
            />

            <GlossaryItem
              number="3"
              title="1100 - 1500 orang per km²"
              items={[
                "Kepadatan penduduk tinggi, mungkin terjadi di kota besar atau pusat perkotaan.",
                "Risiko penyebaran penyakit menular masih tinggi karena tingginya interaksi sosial dan mobilitas penduduk.",
              ]}
            />

            <GlossaryItem
              number="4"
              title="600 - 1.299 orang per km²"
              items={[
                "Kepadatan penduduk sedang, mungkin di daerah perkotaan yang kurang padat atau di wilayah pinggiran kota.",
                "Penyebaran penyakit menular mungkin terjadi, tetapi tingkat risikonya dapat bervariasi tergantung pada faktor-faktor lain seperti akses ke layanan kesehatan dan sanitasi.",
              ]}
            />

            <GlossaryItem
              number="5"
              title="200 - 599 orang per km²"
              items={[
                "Kepadatan penduduk sedang hingga rendah, mungkin di daerah pedesaan atau kota kecil.",
                "Risiko penyebaran penyakit menular masih ada, tetapi mungkin lebih rendah daripada di daerah yang lebih padat.",
              ]}
            />

            <GlossaryItem
              number="6"
              title="100 - 199 orang per km²"
              items={[
                "Kepadatan penduduk rendah hingga sangat rendah, mungkin di daerah pedesaan atau daerah terpencil.",
                "Penyebaran penyakit menular mungkin terjadi tetapi dengan tingkat risiko yang lebih rendah karena interaksi sosial yang lebih terbatas.",
              ]}
            />

            <GlossaryItem
              number="7"
              title="50 - 99 orang per km²"
              items={[
                "Kepadatan penduduk sangat rendah, mungkin di daerah pedesaan yang jarang dihuni.",
                "Risiko penyebaran penyakit menular lebih rendah karena interaksi sosial yang sangat terbatas.",
              ]}
            />

            <GlossaryItem
              number="8"
              title="10 - 49 orang per km²"
              items={[
                "Kepadatan penduduk sangat rendah hingga jarang, mungkin di daerah pedesaan yang sangat terpencil.",
                "Penyebaran penyakit menular cenderung sangat terbatas karena jarangnya interaksi sosial antar individu.",
              ]}
            />

            <GlossaryItem
              number="9"
              title="< 10 orang per km²"
              items={[
                "Kepadatan penduduk sangat rendah, mungkin di daerah terpencil atau daerah dengan kondisi lingkungan yang tidak mendukung tinggal.",
                "Risiko penyebaran penyakit menular sangat rendah karena populasi yang sangat sedikit dan jarangnya interaksi sosial.",
              ]}
            />
          </GlossarySection>

          <GlossarySection title="Ketinggian Wilayah">
            <p className="text-gray-700 mb-4">
              Wilayah dengan ketinggian yang berbeda memiliki karakteristik lingkungan yang beragam, yang memengaruhi
              penyebaran penyakit menular dan vektor yang terlibat.
            </p>

            <ul className="list-disc pl-6 space-y-4 text-gray-700">
              <li>
                Di daerah pegunungan tinggi <span className="font-semibold">(2800 - 4850 m)</span>, dengan suhu dingin
                dan udara tipis, penyakit akibat paparan dingin dan penyakit yang terkait dengan vektor khas dapat
                menjadi masalah.
              </li>
              <li>
                Di pegunungan menengah <span className="font-semibold">(2000 - 2800 m)</span>, suhu lebih dingin namun
                lebih ramah terhadap kehidupan manusia.
              </li>
              <li>
                Di perbukitan atau lereng gunung <span className="font-semibold">(1500 - 2000 m)</span>, suhu hangat dan
                lingkungan yang subur dapat meningkatkan risiko penyakit menular seperti demam berdarah, malaria, dan
                infeksi parasit usus.
              </li>
              <li>
                Wilayah perbukitan yang lebih rendah <span className="font-semibold">(1100 - 1500 m)</span> masih rentan
                terhadap penyakit menular seperti demam berdarah dan malaria.
              </li>
              <li>
                Dalam perbukitan rendah atau daerah lereng gunung yang lebih rendah{" "}
                <span className="font-semibold">(750 - 1100 m)</span>, serta daerah yang lebih lembap dan hangat{" "}
                <span className="font-semibold">(500 - 750 m)</span>, potensi untuk demam berdarah, malaria, dan infeksi
                saluran pernapasan tinggi meningkat.
              </li>
              <li>
                Wilayah dataran rendah atau lereng gunung yang lebih rendah{" "}
                <span className="font-semibold">(120 - 300 m)</span> sering kali menghadapi masalah kesehatan yang
                signifikan akibat demam berdarah, malaria, dan infeksi saluran pernapasan.
              </li>
              <li>
                Di dataran rendah atau daerah pantai <span className="font-semibold">(0 - 120 m)</span>, penyakit
                menular seperti demam berdarah, malaria, dan infeksi saluran pernapasan tetap menjadi perhatian, dengan
                tambahan risiko penyakit yang terkait dengan air.
              </li>
              <li>
                Di daerah pantai atau di bawah permukaan air <span className="font-semibold">(kurang dari 0 m)</span>,
                risiko penyakit menular yang terkait dengan air, seperti penyakit kulit dan penyakit yang ditularkan
                melalui air laut, dapat meningkat.
              </li>
            </ul>
          </GlossarySection>

          <GlossarySection title="Mortalitas">
            <p className="text-gray-700 mb-4">
              Mortalitas adalah tingkat kematian akibat suatu penyakit dalam populasi tertentu selama periode waktu
              tertentu. Mortalitas merupakan pengukuran bentuk angka kematian atau laju kematian, yang menggambarkan
              jumlah kematian akibat suatu penyakit dalam satu populasi dalam satu periode waktu tertentu.
            </p>
          </GlossarySection>

          <GlossarySection title="Prevalensi">
            <p className="text-gray-700 mb-4">
              Prevalensi adalah ukuran proporsi populasi yang menderita penyakit tertentu pada satu titik waktu atau
              selama periode waktu tertentu. Secara umum, prevalensi dihitung dengan mengumpulkan data jumlah kasus
              individu yang terkena penyakit menular selama periode tahunan dan total populasi di seluruh wilayah
              Indonesia selama periode tersebut.
            </p>

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="font-medium">
                Prevalensi = (Jumlah Kasus Penyakit / Total Populasi yang Dipelajari) x 100%
              </p>
            </div>

            <p className="text-gray-700 mb-4">
              Perlu dicatat bahwa saat menerapkan filter atau kriteria tertentu pada data, prevalensi dapat berubah
              sesuai dengan pola data dan jumlah populasi yang tercatat selama periode waktu yang diterapkan melalui
              filter, serta jumlah kasus penyakit yang dipilih.
            </p>
          </GlossarySection>

          <GlossarySection title="Tingkat Kerentanan">
            <p className="text-gray-700 mb-4">
              Tingkat kerentanan dalam konteks penyakit menular dapat diuraikan sebagai berikut, dengan mengacu pada
              skala dari paling minimal hingga katastropik.
            </p>

            <GlossaryItem
              number="1"
              title="Minimal"
              description="Situasi di mana tingkat kerentanan rendah dan risiko penyebaran penyakit menular sangat terbatas. Penyakit tersebut cenderung memiliki dampak yang terbatas terhadap kesehatan masyarakat dan sistem kesehatan."
            />

            <GlossaryItem
              number="2"
              title="Biasa"
              description="Situasi di mana tingkat kerentanan tidak terlalu tinggi namun juga tidak terlalu rendah. Penyakit menular mungkin ada dan menyebabkan beberapa kasus, tetapi tidak mencapai tingkat yang mengkhawatirkan."
            />

            <GlossaryItem
              number="3"
              title="Bahaya"
              description="Tingkat kerentanan tinggi di mana risiko penyebaran penyakit menular mencapai tingkat yang mengkhawatirkan bagi kesehatan masyarakat. Diperlukan tindakan darurat dan intervensi besar-besaran untuk mengendalikan penyebaran penyakit dan melindungi masyarakat."
            />

            <GlossaryItem
              number="4"
              title="Katastropik"
              description="Situasi di mana kerentanan mencapai tingkat tertinggi, dan dampak penyakit menular sangat serius dan luas. Terjadi krisis kesehatan masyarakat yang membutuhkan respons darurat yang luas dan terkoordinasi untuk menangani dampaknya."
            />
          </GlossarySection>

          <GlossarySection title="Tingkat Kewaspadaan">
            <p className="text-gray-700 mb-4">
              Tingkat kewaspadaan biasanya digunakan untuk menunjukkan seberapa serius dan mendesak situasi kesehatan
              masyarakat yang diakibatkan oleh penyebaran penyakit. Berikut adalah definisi setiap tingkat kewaspadaan
              tersebut.
            </p>

            <GlossaryItem
              title="Biasa"
              items={[
                "Situasi normal tanpa adanya ancaman penyakit menular yang signifikan.",
                "Aktivitas sehari-hari dan layanan kesehatan berjalan seperti biasa.",
                "Pemantauan rutin dilakukan, tetapi tidak ada tindakan khusus yang diperlukan.",
              ]}
            />

            <GlossaryItem
              title="Waspada"
              items={[
                "Munculnya beberapa kasus penyakit menular yang lebih tinggi dari rata-rata.",
                "Pemantauan lebih intensif dan komunikasi informasi kesehatan kepada masyarakat.",
                "Peningkatan kewaspadaan di fasilitas kesehatan untuk mendeteksi dan menangani kasus lebih awal.",
              ]}
            />

            <GlossaryItem
              title="Waspada Tinggi"
              items={[
                "Peningkatan signifikan dalam jumlah kasus penyakit menular.",
                "Tindakan pencegahan dan pengendalian lebih ketat diberlakukan.",
                "Masyarakat diimbau untuk lebih berhati-hati dan mengikuti protokol kesehatan yang lebih ketat.",
              ]}
            />

            <GlossaryItem
              title="Bahaya"
              items={[
                "Penyebaran penyakit menular sudah meluas dan mengancam kesehatan masyarakat secara serius.",
                "Tindakan darurat dan intervensi kesehatan masyarakat diterapkan, termasuk pembatasan kegiatan dan mobilitas.",
                "Fasilitas kesehatan mungkin mengalami tekanan karena tingginya jumlah pasien.",
              ]}
            />

            <GlossaryItem
              title="Darurat"
              items={[
                "Situasi krisis dengan penyebaran penyakit menular yang sangat cepat dan luas, mengancam nyawa banyak orang.",
                "Tindakan darurat besar-besaran dilakukan, termasuk karantina wilayah, penutupan fasilitas umum, dan mobilisasi sumber daya kesehatan yang besar.",
                "Komunikasi intensif dengan masyarakat untuk mengikuti arahan dan tindakan pencegahan kritis.",
              ]}
            />
          </GlossarySection>
        </div>  
        )}
      </div>
    </div>
  )
}
