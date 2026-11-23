const IntroCatalog = (() => {
  const url = "https://gugkwqpvtwivqudkimvy.supabase.co";
  const key = "sb_publishable_eM-_5M-a-vHISHIFIeC_lg_Kimof4U5";
  const builtIn = [

  {
    id: "issue-01",
    number: 1,

    title:
      "글로벌 AI 허브 고양특례시 유치 종합 전략 및 실행 안내서",

    date: "2026.10.18",
    pages: 28,

    contents: [

      [1, "앞표지", 1],
      [1, "속표지", 2],
      [1, "머리말", 3],
      [1, "목차", 5],

      [1, "제1부. 종합 전략의 기본체계", 7],

      [2, "제1장. 전략의 목적과 기본 원칙", 7],

      [2, "제2장. 8개 전략문건의 통합체계", 9],

      [2, "제3장. 태그전 필승전략의 실행구조", 10],

      [2, "제4장. 정부 추진 현황과 사실관계 관리", 12],

      [1, "제2부. 공모심사 고득점 전략", 13],

      [2, "제5장. 입지 선정 평가체계", 13],

      [2, "제6장. 평가기준 개선 건의와 대응", 16],

      [2, "제7장. 평가항목별 득점전략", 19],

      [2, "제8장. 경쟁도시별 점수 차이 분석", 23],

      [2, "제9장. 고득점 확보를 위한 우선순위 결정", 25],

      [1, "뒤표지", 28]

    ]

  },

  {
    id: "issue-02",
    number: 2,

    title:
      "글로벌 AI 허브 업무 지원 종합계획서",

    date: "2026.10.29",
    pages: 32,

    contents: [

      [1, "앞표지", 1],
      [1, "속표지", 2],
      [1, "머리말", 4],
      [1, "목차", 6],
      [1, "뒤표지", 32]

    ]

  }

];
  const table = "public_ebook_intros";
  const bucket = "public-ebook-intros";

  const cacheKey = "aihub-public-intros-v1";

  async function load() {
    try {
      const items = await fetchCatalog();
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(items));
      } catch {
        // Reading remains available when browser storage is disabled.
      }
      return items;
    } catch (error) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(cacheKey));
        if (Array.isArray(saved)) return saved;
      } catch {
        // The caller can still show the original public editions.
      }
      throw error;
    }
  }

  async function fetchCatalog() {
    const response = await fetch(url + "/rest/v1/" + table +
      "?select=id,number,title,date,pages,contents,revision,published", {
      headers: { apikey: key }, signal: AbortSignal.timeout(4000), cache: "no-store"
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      if (response.status === 404 && result.code === "PGRST205") return builtIn;
      throw new Error("공개 소개판 목록을 불러오지 못했습니다.");
    }
    const overrides = await response.json();
    const items = new Map(builtIn.map(book => [book.id, book]));
    for (const row of overrides) {
      if (row.published) items.set(row.id, row);
      else items.delete(row.id);
    }
    return [...items.values()].sort((a, b) => a.number - b.number);
  }

  function image(book, number) {
    const name = String(number).padStart(2, "0") + ".webp";
    return book.revision
      ? url + "/storage/v1/object/public/" + bucket + "/" + book.id + "/" + book.revision + "/" + name
      : "./assets/" + book.id + "/" + name;
  }

  return { url, key, table, bucket, builtIn, load, image };
})();
