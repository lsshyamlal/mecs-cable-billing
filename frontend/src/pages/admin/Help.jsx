import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AdminLayout from '../../components/AdminLayout';
import handbook from '../../../../docs/ADMIN_USER_GUIDE.md?raw';
import { parseGuide, searchTopics } from '../../utils/helpGuide';

const { introduction, topics } = parseGuide(handbook);
const markdownComponents = {
  // Tables remain scrollable on phones without widening the entire page.
  table: ({ children }) => (
    <div className="guide-table" tabIndex={0} role="region" aria-label="Guide reference table">
      <table>{children}</table>
    </div>
  ),
  a: ({ href, children }) => href?.startsWith('#')
    ? <Link to={href}>{children}</Link>
    : <a href={href}>{children}</a>,
};

function Markdown({ children }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{children}</ReactMarkdown>;
}

export default function Help() {
  const [query, setQuery] = useState('');
  const { hash, key } = useLocation();
  const visibleTopics = searchTopics(topics, query);

  useEffect(() => {
    if (!hash) return;
    const topic = document.getElementById(hash.slice(1));
    if (topic) {
      topic.scrollIntoView({ block: 'start' });
      topic.focus({ preventScroll: true });
    }
  }, [hash, key]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Help / User Guide</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Find steps for everyday tasks, billing rules, and answers to common questions.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
        <label htmlFor="guide-search" className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Search the guide
        </label>
        <div className="flex gap-2">
          <input
            id="guide-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try payment, grace period, or re-enroll"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && <button type="button" onClick={() => setQuery('')}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            Clear
          </button>}
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {query.trim() ? `${visibleTopics.length} matching topic${visibleTopics.length === 1 ? '' : 's'}` : 'Choose a topic below or search by a few words.'}
        </p>
      </div>

      {visibleTopics.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-[13rem_minmax(0,1fr)] gap-6 items-start">
          <nav aria-label="Guide topics" className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Topics</h2>
            <ul className="grid sm:grid-cols-2 xl:grid-cols-1 gap-1">
              {visibleTopics.map((topic) => (
                <li key={topic.id}>
                  <Link to={`#${topic.id}`} className="block rounded-lg px-2 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 focus-visible:outline-blue-500">
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0 space-y-5">
            {!query.trim() && <div className="admin-guide text-sm text-gray-600 dark:text-gray-400"><Markdown>{introduction}</Markdown></div>}
            {visibleTopics.map((topic) => (
              <section key={topic.id} aria-labelledby={topic.id} className="min-w-0 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6">
                <h2 id={topic.id} tabIndex={-1} className="scroll-mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 focus:outline-none">
                  {topic.title}
                </h2>
                <div className="admin-guide text-sm text-gray-700 dark:text-gray-300"><Markdown>{topic.body}</Markdown></div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-gray-700 dark:text-gray-300">
          <h2 className="font-semibold mb-2">No matching topics</h2>
          <p className="text-sm">Try fewer words, such as “payment” or “customer”, or clear your search to browse all topics.</p>
        </div>
      )}
    </AdminLayout>
  );
}
