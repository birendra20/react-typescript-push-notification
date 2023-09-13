import { useEffect, useState } from "react";

export function useQueryParams() {
  const [queryParams, setQueryParams] = useState({});
  useEffect(() => {
    const searchParams = new URL(window.location.href).searchParams;
    const params: any = {};
    searchParams.forEach((value, key: any) => {
      params[key] = value;
    });

    if (Object.keys(params).length > 0) {
      // Remove the query parameters from the URL without affecting the browser history
      const urlWithoutQueryParams = window.location.href.replace(
        window.location.search,
        ""
      );

      window.history.replaceState({}, document.title, urlWithoutQueryParams);
    }

    setQueryParams(params);
  }, []);

  return queryParams;
}
