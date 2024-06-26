import { useState } from "react";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { configAtom } from "../atoms/configAtom";
import {
  entriesAtom,
  filterStatusAtom,
  filteredEntriesRefreshAtom,
  loadMoreUnreadVisibleAtom,
  loadMoreVisibleAtom,
  offsetAtom,
  totalAtom,
  unreadCountAtom,
  unreadEntriesAtom,
  unreadOffsetAtom,
} from "../atoms/contentAtom";
import { parseFirstImage } from "../utils/images";

const useLoadMore = () => {
  const { pageSize } = useAtomValue(configAtom);

  const [entries, setEntries] = useAtom(entriesAtom);
  const [offset, setOffset] = useAtom(offsetAtom);
  const [unreadEntries, setUnreadEntries] = useAtom(unreadEntriesAtom);
  const [unreadOffset, setUnreadOffset] = useAtom(unreadOffsetAtom);
  const filterStatus = useAtomValue(filterStatusAtom);
  const setLoadMoreUnreadVisible = useSetAtom(loadMoreUnreadVisibleAtom);
  const setLoadMoreVisible = useSetAtom(loadMoreVisibleAtom);
  const total = useAtomValue(totalAtom);
  const unreadCount = useAtomValue(unreadCountAtom);
  const triggerFilteredEntriesRefresh = useSetAtom(filteredEntriesRefreshAtom);

  /* 加载更多 loading*/
  const [loadingMore, setLoadingMore] = useState(false);

  const updateOffset = () => {
    if (filterStatus === "all") {
      setOffset((prev) => prev + pageSize);
    } else {
      setUnreadOffset((prev) => prev + pageSize);
    }
  };

  const updateEntries = (newEntries) => {
    const currentEntries = filterStatus === "all" ? entries : unreadEntries;
    const updatedEntries = new Map([
      ...currentEntries.map((e) => [e.id, e]),
      ...newEntries.map((e) => [e.id, e]),
    ]);
    const result = Array.from(updatedEntries.values());

    if (filterStatus === "all") {
      setEntries(result);
      setLoadMoreVisible(result.length < total);
    } else {
      setUnreadEntries(result);
      setLoadMoreUnreadVisible(result.length < unreadCount);
    }
    return result;
  };

  const handleLoadMore = async (info, getEntries) => {
    setLoadingMore(true);

    try {
      let response;
      if (filterStatus === "all") {
        response = await getEntries(offset + pageSize);
      } else {
        response = await getEntries(unreadOffset + pageSize, filterStatus);
      }
      if (response?.data?.entries) {
        updateOffset();
        const newEntries = response.data.entries.map(parseFirstImage);
        updateEntries(newEntries);
        triggerFilteredEntriesRefresh((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return { handleLoadMore, loadingMore };
};

export default useLoadMore;
