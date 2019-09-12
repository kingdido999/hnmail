const HackerNewsSearchAPI = require("./HackerNewsSearchAPI");

const getDateTimestampSinceDays = sinceDays => {
  return Math.trunc(
    new Date().setDate(new Date().getDate() - sinceDays) / 1000
  );
};

class HackerNewsCrawler {
  static async fetchArticlesByTopics(topics) {
    console.log("Fetching articles...");

    const api = new HackerNewsSearchAPI();
    const sinceDays = getDateTimestampSinceDays(7);
    const numericFilters = `created_at_i>${sinceDays}`;
    const tags = "story";

    let results = {};

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      console.log("Searching topic: %s", topic);

      const { data } = await api.search({ query: topic, numericFilters, tags });
      const articles = data.hits
        .filter(
          (item, index, items) =>
            index === items.findIndex(t => t.title === item.title)
        )
        .map(hit => {
          return {
            ...hit,
            hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`
          };
        })
        .slice(0, 7);

      results[topic] = articles;
    }

    console.log("Fetching done.");

    return results;
  }
}

module.exports = HackerNewsCrawler;
