"use client";

import { useEffect, useMemo, useState } from "react";

function pickAnalysis(prompt) {
  const text = (prompt || "").toLowerCase();
  const fields = {
    style: [],
    lighting: [],
    camera: [],
    mood: [],
    composition: [],
    motion: [],
  };

  const rules = [
    ["style", "cinematic", "cinematic"],
    ["style", "photoreal", "photoreal"],
    ["style", "editorial", "editorial"],
    ["style", "luxury", "luxury"],
    ["lighting", "daylight", "daylight"],
    ["lighting", "warm", "warm light"],
    ["lighting", "soft", "soft light"],
    ["camera", "close-up", "close-up"],
    ["camera", "35mm", "35mm"],
    ["camera", "dynamic camera", "dynamic camera"],
    ["mood", "quiet", "quiet"],
    ["mood", "confidence", "confident"],
    ["mood", "blockbuster", "blockbuster"],
    ["composition", "extreme close-up", "extreme close-up"],
    ["composition", "elegant composition", "elegant composition"],
    ["motion", "motion blur", "motion blur"],
    ["motion", "transforms", "transformation"],
    ["motion", "walking", "walking"],
  ];

  rules.forEach(([key, needle, label]) => {
    if (text.includes(needle) && !fields[key].includes(label)) fields[key].push(label);
  });

  return fields;
}

function buildRemix(seed) {
  const tags = seed?.tags?.join(", ") || "editorial, clean, cinematic";
  return `Create a polished visual prompt inspired by: ${seed?.title || "selected reference"}. Keep the core mood (${tags}) but reinterpret it as a Yena-style archive piece: clean composition, clear subject identity, controlled lighting, refined color palette, premium editorial finish, and practical visual details that can be reused across image or video generation.`;
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [selected, setSelected] = useState(null);
  const [slide, setSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/data/prompts.json")
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => setPosts([]));
  }, []);

  const allTags = useMemo(() => {
    return ["all", ...Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const tagOk = activeTag === "all" || post.tags?.includes(activeTag);
      const qOk = !q || [post.title, post.caption, post.prompt, post.source, ...(post.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
      return tagOk && qOk;
    });
  }, [posts, query, activeTag]);

  function openPost(post) {
    setSelected(post);
    setSlide(0);
    setCopied(false);
  }

  async function copyPrompt(text) {
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  }

  const analysis = selected ? pickAnalysis(selected.prompt) : null;
  const images = selected?.images?.length ? selected.images : selected?.thumbnail ? [selected.thumbnail] : [];

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">YENA PROMPT MAGAZINE</p>
          <h1>프롬프트를 저장하고, 분석하고, 예나 스타일로 다시 만드는 공간</h1>
          <p className="heroText">
            Reactor 같은 프롬프트 매거진 구조를 참고해서 만든 첫 번째 실험실. 지금은 JSON 기반이고, 나중에 DB와 AI 분석기를 붙이면 돼.
          </p>
        </div>
        <div className="heroCard">
          <span>{posts.length}</span>
          <p>archived prompts</p>
        </div>
      </section>

      <section className="controls">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="검색: cinematic, hotel, robot, yenarity..."
        />
        <div className="tags">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={activeTag === tag ? "active" : ""}
              onClick={() => setActiveTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      <section className="grid">
        {filtered.map((post) => (
          <article key={post.id} className="card" onClick={() => openPost(post)}>
            <div className="thumb">
              {post.thumbnail ? <img src={post.thumbnail} alt={post.title} /> : <div className="emptyThumb">No image</div>}
            </div>
            <div className="cardBody">
              <div className="metaRow">
                <span>{post.source || "archive"}</span>
                <span>{post.date}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.caption}</p>
              <div className="cardTags">
                {(post.tags || []).slice(0, 5).map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
            </div>
          </article>
        ))}
      </section>

      {selected && (
        <div className="modalOverlay" onClick={(event) => event.target === event.currentTarget && setSelected(null)}>
          <div className="modal">
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <div className="modalMedia">
              {images.length ? <img src={images[slide]} alt={selected.title} /> : <div className="emptyLarge">No image</div>}
              {images.length > 1 && (
                <div className="slideNav">
                  <button onClick={() => setSlide((slide - 1 + images.length) % images.length)}>‹</button>
                  <span>{slide + 1} / {images.length}</span>
                  <button onClick={() => setSlide((slide + 1) % images.length)}>›</button>
                </div>
              )}
            </div>
            <div className="modalBody">
              <p className="eyebrow">{selected.source}</p>
              <h2>{selected.title}</h2>
              <p className="caption">{selected.caption}</p>

              <div className="cardTags detailTags">
                {(selected.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}
              </div>

              <div className="sectionTitle">Prompt</div>
              <pre className="promptBox">{selected.prompt}</pre>
              <div className="actions">
                <button onClick={() => copyPrompt(selected.prompt)}>{copied ? "복사됨!" : "프롬프트 복사"}</button>
                {selected.threadsUrl && <a href={selected.threadsUrl} target="_blank">원본 보기</a>}
              </div>

              <div className="sectionTitle">Quick Analysis</div>
              <div className="analysisGrid">
                {Object.entries(analysis).map(([key, values]) => (
                  <div key={key} className="analysisCard">
                    <b>{key}</b>
                    <p>{values.length ? values.join(", ") : "아직 자동 감지 없음"}</p>
                  </div>
                ))}
              </div>

              <div className="sectionTitle">Yena Remix Starter</div>
              <pre className="promptBox remix">{buildRemix(selected)}</pre>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
