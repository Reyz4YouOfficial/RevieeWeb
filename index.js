app.get("/youtube-downloader", (req, res) => {
  const filePath = path.join(__dirname, "youtube.html");
  res.sendFile(filePath);
});

app.post('/api/youtube/search', requireAuth, async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: "Query pencarian wajib diisi." });
  }

  try {
    const apiEndpoints = [
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
      `https://api.nvidiabotz.xyz/search/youtube?q=${encodeURIComponent(query)}`,
      `https://yt-api.mojokertohost.xyz/search?q=${encodeURIComponent(query)}`
    ];

    let searchData = null;
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Mencoba API: ${endpoint}`);
        const response = await axios.get(endpoint, { timeout: 10000 });
        
        if (response.data && (response.data.data || response.data.result)) {
          searchData = response.data.data || response.data.result;
          console.log(`Berhasil dengan API: ${endpoint}`);
          break;
        }
      } catch (apiError) {
        console.log(`API ${endpoint} gagal:`, apiError.message);
        continue;
      }
    }

    if (!searchData) {
      return res.status(404).json({ 
        error: "Semua API tidak merespons. Coba lagi nanti." 
      });
    }

    const formattedResults = Array.isArray(searchData) ? searchData : [searchData];
    
    return res.json({
      success: true,
      results: formattedResults
    });

  } catch (error) {
    console.error('YouTube Search Error:', error.message);
    res.status(500).json({ 
      error: "Gagal mencari video. Coba gunakan kata kunci lain." 
    });
  }
});

app.post('/api/youtube/download', requireAuth, async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: "URL video YouTube wajib diisi." });
  }

  try {
    const downloadEndpoints = [
      `https://restapi-v2.simplebot.my.id/download/ytmp3?url=${encodeURIComponent(url)}`,
      `https://api.azz.biz.id/download/ytmp3?url=${encodeURIComponent(url)}`,
      `https://yt-api.mojokertohost.xyz/download?url=${encodeURIComponent(url)}&type=mp3`
    ];

    let downloadUrl = null;
    let audioTitle = "YouTube Audio";
    
    for (const endpoint of downloadEndpoints) {
      try {
        console.log(`Mencoba download API: ${endpoint}`);
        const response = await axios.get(endpoint, { timeout: 15000 });
        
        if (response.data && response.data.result) {
          downloadUrl = response.data.result;
          audioTitle = response.data.title || "YouTube Audio";
          console.log(`Berhasil dengan download API: ${endpoint}`);
          break;
        }
      } catch (apiError) {
        console.log(`Download API ${endpoint} gagal:`, apiError.message);
        continue;
      }
    }

    if (!downloadUrl) {
      return res.status(404).json({ 
        error: "Tidak dapat mengunduh audio. Coba video lain." 
      });
    }

    return res.json({
      success: true,
      audioUrl: downloadUrl,
      title: audioTitle
    });

  } catch (error) {
    console.error('YouTube Download Error:', error.message);
    res.status(500).json({ 
      error: "Terjadi kesalahan saat memproses download." 
    });
  }
});
// ==================== GRID PLUS AI IMAGE GENERATOR ==================== //
const FormData = require('form-data');

const MIME_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg", 
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp"
};

const DL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://www.google.com/",
  "Sec-Fetch-Dest": "image",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
  Priority: "u=1, i"
};

class GridPlus {
  constructor() {
    this.ins = axios.create({
      baseURL: "https://api.grid.plus/v1",
      headers: {
        "user-agent": "Mozilla/5.0 (Android 15; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0",
        "X-AppID": "808645",
        "X-Platform": "h5",
        "X-Version": "8.9.7",
        "X-SessionToken": "",
        "X-UniqueID": this.uid(),
        "X-GhostID": this.uid(),
        "X-DeviceID": this.uid(),
        "X-MCC": "id-ID",
        sig: `XX${this.uid() + this.uid()}`
      }
    });
  }

  uid() {
    return crypto.randomUUID().replace(/-/g, "");
  }

  form(dt) {
    const f = new FormData();
    Object.entries(dt ?? {}).forEach(([k, v]) => {
      if (v != null) f.append(k, String(v));
    });
    return f;
  }

  ext(buf) {
    const h = buf.subarray(0, 12).toString("hex");
    return h.startsWith("ffd8ffe") ? "jpg" : h.startsWith("89504e47") ? "png" : h.startsWith("52494646") && h.substring(16, 24) === "57454250" ? "webp" : h.startsWith("47494638") ? "gif" : h.startsWith("424d") ? "bmp" : "png";
  }

  async up(buf, mtd) {
    if (!Buffer.isBuffer(buf)) throw new Error("Data bukan Buffer");
    const e = this.ext(buf);
    const mime = MIME_MAP[e] ?? "image/png";
    try {
      const d = await this.ins.post("/ai/web/nologin/getuploadurl", this.form({
        ext: e,
        method: mtd
      })).then(r => r?.data);
      await axios.put(d.data.upload_url, buf, {
        headers: {
          "content-type": mime
        }
      });
      const imgUrl = d?.data?.img_url;
      return imgUrl;
    } catch (err) {
      throw err;
    }
  }

  async poll({ path, data, sl = () => false }) {
    const start = Date.now(),
      interval = 3e3,
      timeout = 6e4;
    return new Promise((resolve, reject) => {
      const check = async () => {
        if (Date.now() - start > timeout) {
          return reject(new Error("Polling timeout"));
        }
        try {
          const r = await this.ins({
            url: path,
            method: data ? "POST" : "GET",
            ...data ? { data: data } : {}
          });
          const errMsg = r?.data?.errmsg?.trim();
          if (errMsg) {
            return reject(new Error(errMsg));
          }
          if (sl(r.data)) {
            return resolve(r.data);
          }
          setTimeout(check, interval);
        } catch (err) {
          reject(err);
        }
      };
      check();
    });
  }

  async generate({ prompt = "enhance image quality", imageUrl, ...rest }) {
    try {
      let requestData = {
        prompt: prompt,
        ...rest
      };

      if (imageUrl) {
        let buf = imageUrl;
        if (typeof imageUrl === "string") {
          if (imageUrl.startsWith("http")) {
            const res = await axios.get(imageUrl, {
              responseType: "arraybuffer",
              headers: DL_HEADERS,
              timeout: 15e3,
              maxRedirects: 5
            });
            buf = Buffer.from(res.data);
          } else if (imageUrl.startsWith("data:")) {
            const b64 = imageUrl.split(",")[1] || "";
            buf = Buffer.from(b64, "base64");
          } else {
            buf = Buffer.from(imageUrl, "base64");
          }
        }
        if (!Buffer.isBuffer(buf) || buf.length === 0) {
          throw new Error("Gambar tidak valid atau kosong");
        }
        const uploadedUrl = await this.up(buf, "wn_aistyle_nano");
        requestData.url = uploadedUrl;
      }

      const taskRes = await this.ins.post("/ai/nano/upload", this.form(requestData)).then(r => r?.data);
      const taskId = taskRes?.task_id;
      if (!taskId) throw new Error("Task ID tidak ditemukan");
      
      const result = await this.poll({
        path: `/ai/nano/get_result/${taskId}`,
        sl: d => d?.code === 0 && !!d?.image_url
      });
      
      return result;
    } catch (err) {
      throw err;
    }
  }
}

// ==================== RCIMAGE AI ROUTES ==================== //

// Route untuk halaman RcImage AI
app.get("/rcimage-ai", (req, res) => {
  const filePath = path.join(__dirname, "rcimage-ai.html");
  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return res.status(500).send("❌ File tidak ditemukan");
    res.send(html);
  });
});

// API endpoint untuk RcImage AI
app.post('/api/rcimage-ai', requireAuth, async (req, res) => {
  const params = req.body;
  
  if (!params.prompt) {
    return res.status(400).json({
      error: "Input 'prompt' wajib diisi."
    });
  }

  try {
    const api = new GridPlus();
    const response = await api.generate(params);
    return res.status(200).json(response);
  } catch (error) {
    console.error('RcImage AI Error:', error);
    res.status(500).json({
      error: error.message || "Internal Server Error"
    });
  }
});
