import { useState, useCallback } from 'react';

// url: endpoint to which you want to send request
// isLoadingOnMount: set isLoading value to true on first render
// clearDataOnLoad: clear data currently in state on new load; in time between
//  fetching and returning new data, there'll be no data stored in state

// opts: object containing same options as native Fetch API
// query: query params of type URLSearchParams to append to base URL

// Static values passed to outer useFetch, dynamic values to inner doFetch
// data/error states contain a statusCode property as well as a body so clients can differentiate
//   between types of successful or unsuccessful calls (200, 201 204, or 401, 409, etc)
const useFetch = (url, {
  isLoadingOnMount = false,
  clearDataOnLoad = false,
} = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(!!isLoadingOnMount);
  const [error, setError] = useState(null);

  const doFetch = useCallback(async (opts = {}, query = null) => {
    setIsLoading(true);
    setError(null);
    if (clearDataOnLoad) setData(null);

    try {
      // If client passes a query, append to original URL
      const fullUrl = query ? `${ url }?${ query.toString() }` : url;

      // Make fetch call
      const res = await fetch(fullUrl, opts);

      // Parse JSON body if it exists (both success and errors)
      let body;

      if (res.headers.get('content-type')?.includes('application/json')) {
        body = await res.json();
      }

      // Throw a custom error if response code isn't in the 200 range
      if (!res.ok) {
        const error = new Error(body?.message || 'Something went wrong...');
        error.status = res.status;
        throw error;
      }
      
      setData({ statusCode: res.status, body });
    } catch (err) {
      setError({ statusCode: err.status, message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [url, clearDataOnLoad]);

  return [{ data, isLoading, error }, doFetch];
};

export default useFetch;
