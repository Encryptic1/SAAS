const url = process.argv[2];
fetch(url)
  .then(async (r) => {
    const text = await r.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (parsed) {
      console.log(JSON.stringify(parsed, null, 2).slice(0, 2500));
    } else {
      // extract message from HTML error page
      const m = text.match(/"message":"([^"]+)"/);
      const m2 = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
      const m3 = text.match(/digest[":\s]+([\w-]+)/);
      console.log("HTML response. message:", m?.[1]?.slice(0, 400));
      console.log("pre:", m2?.[1]?.trim()?.slice(0, 400));
      console.log("digest:", m3?.[1]);
    }
  })
  .catch((e) => console.log("err", e.message));
