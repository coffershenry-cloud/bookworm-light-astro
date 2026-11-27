import redirects from "./blogger-redirects.json";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const destination = redirects[url.pathname];

    if (destination) {
      return Response.redirect(
        new URL(destination, url.origin).toString(),
        301
      );
    }

    return env.ASSETS.fetch(request);
  }
};
