(async()=>{
  const url1 = 'https://sharehubnepal.com/data/api/v1/price-history?pageSize=10&symbol=RSDC';
  const url2 = 'https://chukul.com/api/data/v2/floorsheet/bydate/?date=2026-03-31&page=2&size=500';
  try {
    const r = await fetch(url1);
    console.log('price status', r.status);
    const j = await r.json();
    console.log('price', JSON.stringify(j).substring(0,1200));
  } catch (e) { console.error('price err', e); }
  try {
    const r = await fetch(url2);
    console.log('floor status', r.status);
    const j = await r.json();
    console.log('floor', JSON.stringify(j).substring(0,1200));
  } catch (e) { console.error('floor err', e); }
})();
