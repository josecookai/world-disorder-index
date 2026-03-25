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

export const wtoRssFixture = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>WTO members discuss new tariff retaliation and shipping disruption risks</title>
      <link>https://www.wto.org/english/news_e/news26_e/test_01.htm</link>
      <pubDate>Mon, 23 Mar 2026 00:00:00 GMT</pubDate>
      <description>Tariff measures and shipping disruption continue to affect global trade.</description>
    </item>
    <item>
      <title></title>
      <link>https://www.wto.org/english/news_e/news26_e/ignored.htm</link>
      <pubDate>Mon, 23 Mar 2026 00:00:00 GMT</pubDate>
      <description>Missing title</description>
    </item>
  </channel>
</rss>`;

export const eiaRssFixture = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>EIA sees crude exports and LNG shipping disruption raising energy costs</title>
      <link>/pressroom/releases/press999.php</link>
      <pubDate>Tue, 10 Mar 2026 12:00:00 EST</pubDate>
      <description>Crude exports, LNG flows, and tanker rerouting are tightening energy markets.</description>
    </item>
    <item>
      <title>Ignored item</title>
      <link></link>
      <pubDate>Tue, 10 Mar 2026 12:00:00 EST</pubDate>
      <description>Missing link</description>
    </item>
  </channel>
</rss>`;

export const unSecurityCouncilHtmlFixture = `
<div class="view-content">
  <div class="views-row">
    <article class="node node--view-mode-content-list-item clearfix">
      <div class="field field--name-field-dated field--type-datetime field--label-hidden">
        <div class='field__items'>
          <div class="field__item"><time datetime="2026-03-12T12:00:00Z" class="datetime">12 March 2026</time></div>
        </div>
      </div>
      <div class="field field--name-field-display-title field--type-string field--label-hidden">
        <div class='field__items'>
          <div class="field__item"><h3><a href="/en/2026/sc16316.doc.htm" hreflang="en">Security Council Debates Iran Nuclear Programme amid Dispute over Snapback Sanctions</a></h3></div>
        </div>
      </div>
      <div class="clearfix text-formatted field field--name-body field--type-text-with-summary field--label-hidden">
        <div class='field__items'>
          <div class="field__item"><p>Delegates discussed sanctions pressure and nuclear safeguards risks.</p></div>
        </div>
      </div>
    </article>
  </div>
  <div class="views-row">
    <article class="node node--view-mode-content-list-item clearfix">
      <div class="field field--name-field-dated field--type-datetime field--label-hidden">
        <div class='field__items'>
          <div class="field__item"><time datetime="2026-03-24T12:00:00Z" class="datetime">24 March 2026</time></div>
        </div>
      </div>
      <div class="field field--name-field-display-title field--type-string field--label-hidden">
        <div class='field__items'>
          <div class="field__item"><h3><a href="/en/sc_live" hreflang="en">LIVE Blog - UN Security Council</a></h3></div>
        </div>
      </div>
    </article>
  </div>
</div>`;
