// The handbook uses level-two headings as topics and GitHub-style anchor links.
export function topicId(title) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
}

export function parseGuide(markdown) {
  const [intro, ...sections] = markdown.replace(/\r\n/g, '\n').split(/^## /m);
  return {
    introduction: intro.replace(/^# .*\n+/, '').trim(),
    topics: sections.map((section) => {
      const newline = section.indexOf('\n');
      const title = (newline === -1 ? section : section.slice(0, newline)).trim();
      return { id: topicId(title), title, body: newline === -1 ? '' : section.slice(newline + 1).trim() };
    }).filter((topic) => topic.id !== 'contents'),
  };
}

export function searchTopics(topics, query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return topics.filter((topic) => {
    const text = `${topic.title} ${topic.body}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
