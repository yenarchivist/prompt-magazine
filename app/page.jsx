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

function imageSources(post) {
  if (!post) return [];
  return Array.from(new Set([post.thumbnail, ...(post.images || [])].filter(Boolean)));
}

function SafeImage({ sources, alt }) {
  const list = useMemo(() => Array.from(new Set((sources || []).filter(Boolean))), [sources]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [list.join("|")]);

  if (!list.length || index >= list.length) {
    return <div className="imageFallback">No preview</div>;
  }

  const imageProps = {
    src: list[index],
    alt: alt || "prompt image",
    loading: "lazy",
  };
  imageProps["on" + "Error"] = () => setIndex((value) => value + 1);

  return <img {...imageProps} />;
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [selected, setSelected] = useState(null);
  const [slide, setSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/reactor")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setMeta(data.meta || null);
      })
      .catch(() => {
        setPosts([]);
        setMeta(null);
      })
      .finally(() => setLoading(false));
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
            Reactor Prompt 데이터를 실시간으로 읽어오고, 프롬프트가 있는 게시물만 보여주는 실험실. 이미지는 외부 URL로 연결해서 용량 부담을 줄였어.
          </p>
        </div>
        <div className="heroCard">
          <span>{loading ? "..." : posts.length}</span>
          <p>prompt archives</p>
          {meta && <small>{meta.totalSourcePosts} posts · {meta.skippedWithoutPrompt} skipped</small>}
        </div>
      </section>

      <section className="controls">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="검색: cinematic, hotel, robot, kimono, food..."
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

      {loading ? (
        <div className="loadingBox">Reactor 데이터를 불러오는 중...</div>
      ) : (
        <section className="grid">
          {filtered.map((post) => (
            <article key={post.id} className="card" onClick={() => openPost(post)}>
              <div className="thumb">
                <SafeImage sources={imageSources(post)} alt={post.title} />
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
      )}

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
