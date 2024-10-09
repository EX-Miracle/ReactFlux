import { useEffect, useState } from "react";

import { useStore } from "@nanostores/react";
import {
  contentState,
  filteredEntriesState,
  setActiveContent,
  setIsArticleFocused,
} from "../store/contentState";
import { extractImageSources } from "../utils/images";
import useLoadMore from "./useLoadMore";
import { usePhotoSlider } from "./usePhotoSlider";

const useKeyHandlers = (handleEntryClick, entryListRef) => {
  const { activeContent, loadMoreVisible } = useStore(contentState);
  const filteredEntries = useStore(filteredEntriesState);

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, setSelectedIndex } =
    usePhotoSlider();

  const { loadingMore } = useLoadMore();

  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoadNext, setShouldLoadNext] = useState(false);

  useEffect(() => {
    if (shouldLoadNext && !loadingMore) {
      setIsLoading(false);
      setShouldLoadNext(false);
      navigateToNextArticle();
    }
  }, [loadingMore, shouldLoadNext]);

  useEffect(() => {
    if (activeContent) {
      document.querySelector(".card-custom-selected-style")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeContent]);

  const withActiveContent =
    (fn) =>
    (...args) => {
      if (activeContent) {
        return fn(...args);
      }
    };

  const exitDetailView = withActiveContent(() => {
    setActiveContent(null);
    if (entryListRef.current) {
      entryListRef.current.contentWrapperEl.focus();
    }
  });

  const navigateToPreviousArticle = (unread = false) => {
    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );

    if (currentIndex > 0) {
      const prevEntry = unread
        ? filteredEntries
            .slice(0, currentIndex)
            .toReversed()
            .find((entry) => entry.status === "unread")
        : filteredEntries[currentIndex - 1];

      if (prevEntry) {
        handleEntryClick(prevEntry);
      }
    }
  };

  const navigateToNextArticle = (unread = false) => {
    if (isLoading) {
      return;
    }

    const currentIndex = filteredEntries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );
    const isLastEntry = currentIndex === filteredEntries.length - 1;

    if (isLastEntry && loadMoreVisible) {
      setIsLoading(true);
      setShouldLoadNext(true);
      return;
    }

    if (currentIndex === -1) {
      entryListRef.current.contentWrapperEl.scrollTo({ top: 0 });
      return;
    }

    const nextEntry = unread
      ? filteredEntries
          .slice(currentIndex + 1)
          .find((entry) => entry.status === "unread")
      : filteredEntries[currentIndex + 1];

    if (nextEntry) {
      handleEntryClick(nextEntry);
      setShouldLoadNext(false);
    }
  };

  const openLinkExternally = withActiveContent(() => {
    window.open(activeContent.url, "_blank");
  });

  const fetchOriginalArticle = withActiveContent((handleFetchContent) => {
    handleFetchContent();
  });

  const saveToThirdPartyServices = withActiveContent(
    (handleSaveToThirdPartyServices) => {
      handleSaveToThirdPartyServices();
    },
  );

  const toggleReadStatus = withActiveContent((handleUpdateEntry) => {
    handleUpdateEntry();
  });

  const toggleStarStatus = withActiveContent((handleStarEntry) => {
    handleStarEntry();
  });

  const openPhotoSlider = withActiveContent(() => {
    const imageSources = extractImageSources(activeContent.content);
    if (!imageSources.length || isPhotoSliderVisible) {
      return;
    }

    setSelectedIndex(0);
    setIsPhotoSliderVisible(true);
    setIsArticleFocused(false);
  });

  return {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToPreviousArticle,
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices,
    toggleReadStatus,
    toggleStarStatus,
  };
};

export default useKeyHandlers;
