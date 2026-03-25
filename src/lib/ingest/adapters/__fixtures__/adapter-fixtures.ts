export const gdeltFixture = {
  articles: [
    {
      title: "Missile attack drives new sanctions package",
      url: "https://example.com/gdelt/missile-attack",
      seendate: "20260324112233",
      domain: "Example Wire",
      sourcecountry: "US",
    },
    {
      title: "Cultural festival opens downtown",
      url: "https://example.com/gdelt/festival",
      seendate: "20260324120000",
      domain: "Local Daily",
      sourcecountry: "US",
    },
  ],
};

export const iaeaRssFixture = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>IAEA reports safeguards update at nuclear facility</title>
      <link>https://www.iaea.org/news/1</link>
      <pubDate>Tue, 24 Mar 2026 09:30:00 GMT</pubDate>
      <description><![CDATA[Safeguards mission and verification details]]></description>
    </item>
    <item>
      <title></title>
      <link>https://www.iaea.org/news/ignored</link>
      <pubDate>Tue, 24 Mar 2026 10:00:00 GMT</pubDate>
      <description>Missing title should be ignored</description>
    </item>
  </channel>
</rss>`;

export const ofacCsvFixture = [
  "ENT_NUM,SDN_NAME,SDN_TYPE,PROGRAM,REMARKS",
  '10001,"ALPHA TRADING LLC","Entity","RUSSIA-EO14024","Example remarks"',
  '10002,"BETA SHIPPING CO","Vessel","IRAN-EO13846","Second remarks"',
].join("\n");

export const opensanctionsFixture = [
  JSON.stringify({
    id: "Q123",
    caption: "Alpha Holdings",
    schema: "Sanctions",
    datasets: ["eu_fsf", "us_ofac"],
    last_seen: "2026-03-24T10:15:00Z",
  }),
  JSON.stringify({
    id: "Q999",
    schema: "Person",
  }),
  "{invalid json",
].join("\n");
