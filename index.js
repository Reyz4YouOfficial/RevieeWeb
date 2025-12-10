app.get("/youtube-downloader", requireAuth, (req, res) => {
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
