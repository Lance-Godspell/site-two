// Lightweight static blog engine for GitHub Pages
const App = {
  state: {
    posts: [],
    filtered: [],
    siteTitle: "Trikster - Blog",
  },
  async loadIndex() {
    const res = await fetch('posts/posts.json?_=' + Date.now());
    const data = await res.json();
    // Sort posts by date desc
    data.sort((a,b) => new Date(b.date) - new Date(a.date));
    this.state.posts = data;
    this.state.filtered = data;
  },
  router() {
    const hash = location.hash.slice(1);
    if (!hash || hash === '/') return this.renderHome();
    const [_, route, slug] = hash.split('/'); // #/post/slug
    if (route === 'post' && slug) return this.renderPost(slug);
    if (route === 'archive') return this.renderArchive();
    if (route === 'about') return this.renderAbout();
    return this.renderHome();
  },
  search(term) {
    term = term.toLowerCase();
    this.state.filtered = this.state.posts.filter(p =>
      p.title.toLowerCase().includes(term) ||
      (p.tags||[]).join(' ').toLowerCase().includes(term) ||
      (p.excerpt||'').toLowerCase().includes(term)
    );
    this.router();
  },
  renderHome() {
    const app = document.getElementById('app');
    const latest = this.state.filtered[0];
    const rest = this.state.filtered.slice(1, 7);
    app.innerHTML = `
      ${latest ? `
      <section class="grid md:grid-cols-2 gap-6 items-stretch">
        <article class="glass rounded-2xl p-6">
          <p class="text-sm text-slate-400 mb-2">Aktueller Post</p>
          <h2 class="text-2xl font-bold"><a class="hover:underline" href="#/post/${latest.slug}">${latest.title}</a></h2>
          <p class="mt-2 text-slate-300">${latest.excerpt||''}</p>
          <div class="mt-4 flex items-center gap-3 text-slate-400 text-sm">
            <span>${new Date(latest.date).toLocaleDateString()}</span>
            <span>·</span>
            <span class="flex gap-2">${(latest.tags||[]).map(t=>`<span class="tag">${t}</span>`).join(' ')}</span>
          </div>
        </article>
        <article class="glass rounded-2xl p-0 overflow-hidden">
          ${latest.cover ? `<img class="w-full h-full object-cover" src="${latest.cover}" alt="">` : `<div class="h-full p-6 flex items-center justify-center text-slate-400">No cover image</div>`}
        </article>
      </section>` : ``}
      <section class="mt-10">
        <div class="flex items-baseline justify-between">
          <h3 class="text-xl font-semibold">Recent posts</h3>
          <a class="text-slate-400 hover:text-white" href="#/archive">View all</a>
        </div>
        <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${rest.map(p => `
            <article class="glass rounded-2xl p-5 hover:ring-1 hover:ring-indigo-500/40 transition">
              <a href="#/post/${p.slug}">
                <h4 class="text-lg font-semibold">${p.title}</h4>
                <p class="mt-2 text-sm text-slate-300 line-clamp-3">${p.excerpt||''}</p>
                <div class="mt-3 text-xs text-slate-400">${new Date(p.date).toLocaleDateString()} · ${(p.tags||[]).join(', ')}</div>
              </a>
            </article>`).join('')}
        </div>
      </section>
    `;
  },
  async renderPost(slug) {
    const app = document.getElementById('app');
    const post = this.state.posts.find(p => p.slug === slug);
    if (!post) { app.innerHTML = `<p>Post not found.</p>`; return; }
    document.title = `${post.title} — ${this.state.siteTitle}`;
    const res = await fetch(`posts/${slug}.md?_=` + Date.now());
    const md = await res.text();
    // Build TOC
    const temp = document.createElement('div');
    temp.innerHTML = marked.parse(md, { mangle: false, headerIds: true });
    const headings = [...temp.querySelectorAll('h2, h3')].map(h => ({
      level: h.tagName.toLowerCase(),
      id: h.id,
      text: h.textContent
    }));
    const toc = headings.map(h => `
      <a href="#${h.id}" class="block text-sm ${h.level==='h3' ? 'ml-4' : ''} hover:text-white">${h.text}</a>
    `).join('');

    app.innerHTML = `
      <article class="prose prose-invert max-w-none">
        <div class="mb-6">
          <a href="#" class="text-slate-400 hover:text-white">&larr; Back</a>
        </div>
        <h1 class="text-4xl font-extrabold tracking-tight">${post.title}</h1>
        <div class="mt-2 text-slate-400">${new Date(post.date).toLocaleDateString()} · ${(post.tags||[]).join(', ')}</div>
        ${post.cover ? `<img src="${post.cover}" alt="" class="mt-6 rounded-2xl">` : ``}
        <div class="grid lg:grid-cols-[1fr_260px] gap-10 mt-8">
          <div id="post-body" class="leading-7"></div>
          <aside class="glass rounded-2xl p-4 h-max sticky top-24">
            <h3 class="font-semibold mb-3">Table of contents</h3>
            ${toc || '<p class="text-slate-400 text-sm">No headings</p>'}
            <hr class="my-4 border-white/10">
            <p class="text-sm text-slate-400">Enjoyed this? Discuss on <a class="underline" href="https://github.com/" target="_blank">GitHub</a>.</p>
          </aside>
        </div>
      </article>
    `;
    document.getElementById('post-body').innerHTML = temp.innerHTML;
  },
  renderArchive() {
    const app = document.getElementById('app');
    const groups = {};
    this.state.filtered.forEach(p => {
      const y = new Date(p.date).getFullYear();
      groups[y] = groups[y] || [];
      groups[y].push(p);
    });
    const years = Object.keys(groups).sort((a,b)=>b-a);
    app.innerHTML = years.map(y => `
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-3">${y}</h2>
        <div class="grid md:grid-cols-2 gap-4">
          ${groups[y].map(p => `
            <a class="glass rounded-xl p-4 hover:ring-1 hover:ring-indigo-500/40" href="#/post/${p.slug}">
              <div class="text-sm text-slate-400">${new Date(p.date).toLocaleDateString()}</div>
              <div class="font-semibold">${p.title}</div>
              <div class="text-sm text-slate-400">${(p.tags||[]).join(', ')}</div>
            </a>
          `).join('')}
        </div>
      </section>
    `).join('');
  },
  renderAbout() {
    document.getElementById('app').innerHTML = `
      <section class="glass rounded-2xl p-6">
        <h2 class="text-2xl font-bold">About</h2>
        <p class="mt-2 text-slate-300">Write your bio here. This template is a static, GitHub Pages‑friendly blog, inspired by Patreon’s layout.</p>
        <p class="mt-2 text-slate-300">Add Markdown files into <code>/posts</code> and list them in <code>/posts/posts.json</code>.</p>
      </section>
    `;
  },
};

// Wire up
window.addEventListener('hashchange', () => App.router());
window.addEventListener('DOMContentLoaded', async () => {
  await App.loadIndex();
  App.router();
  const s = document.getElementById('search');
  s.addEventListener('input', (e) => App.search(e.target.value));
});
