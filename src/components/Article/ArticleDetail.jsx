import { Button, Divider, Tag, Typography } from "@arco-design/web-react";
import { IconEmpty, IconImage } from "@arco-design/web-react/icon";
import dayjs from "dayjs";
import ReactHtmlParser from "html-react-parser";
import { useAtomValue, useSetAtom } from "jotai";
import { forwardRef, useEffect, useState } from "react";
import { PhotoSlider } from "react-photo-view";
import { Link, useNavigate } from "react-router-dom";

import "react-photo-view/dist/react-photo-view.css";
import { configAtom } from "../../atoms/configAtom";
import { isArticleFocusedAtom } from "../../atoms/contentAtom";
import { useActiveContent } from "../../hooks/useActiveContent";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { extractImageSources } from "../../utils/images";
import ActionButtons from "./ActionButtons";
import "./ArticleDetail.css";

const CustomLink = ({ url, text }) => {
  const [isHovering, setIsHovering] = useState(false);
  const toggleHover = () => setIsHovering(!isHovering);

  return (
    <Link
      to={url}
      style={{
        color: "inherit",
        textDecoration: isHovering ? "underline" : "none",
      }}
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
    >
      {text}
    </Link>
  );
};

const ImageOverlayButton = ({ node, index, togglePhotoSlider }) => {
  const [isHovering, setIsHovering] = useState(false);
  const { isMobileView } = useScreenWidth();

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div
        style={{ display: "inline-block", position: "relative" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img {...node.attribs} alt={node.attribs.alt} />
        <Button
          icon={<IconImage />}
          style={{
            position: "absolute",
            top: 30,
            right: 10,
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            opacity: isMobileView || isHovering ? 1 : 0,
            transition: "opacity 0.3s",
          }}
          onClick={(event) => {
            event.preventDefault();
            togglePhotoSlider(index);
          }}
        />
      </div>
    </div>
  );
};

const getHtmlParserOptions = (imageSources, togglePhotoSlider) => ({
  replace: (node) => {
    if (node.type === "tag" && node.name === "img") {
      const index = imageSources.findIndex((src) => src === node.attribs.src);
      return (
        <ImageOverlayButton
          node={node}
          index={index}
          togglePhotoSlider={togglePhotoSlider}
        />
      );
    }
    return node;
  },
});

const ArticleDetail = forwardRef(
  ({ info, handleEntryClick, getEntries, entryListRef }, ref) => {
    const navigate = useNavigate();
    const { activeContent } = useActiveContent();
    const config = useAtomValue(configAtom);
    const { articleWidth, fontSize } = config;
    const setIsArticleFocused = useSetAtom(isArticleFocusedAtom);
    const [isPhotoSliderVisible, setIsPhotoSliderVisible] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const togglePhotoSlider = (index) => {
      setSelectedIndex(index);
      setIsPhotoSliderVisible((prev) => !prev);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
      const scrollContainer = ref.current?.querySelector(".scroll-container");
      if (scrollContainer) {
        scrollContainer.setAttribute("tabIndex", "-1");
        setTimeout(() => {
          scrollContainer.focus();
        }, 200);
      }
    }, [activeContent?.id]);

    if (!activeContent) {
      return (
        <div ref={ref} className="content-empty">
          <IconEmpty style={{ fontSize: "64px" }} />
          <Typography.Title
            heading={6}
            style={{ color: "var(--color-text-3)", marginTop: "10px" }}
          >
            ReactFlux
          </Typography.Title>
        </div>
      );
    }

    const imageSources = extractImageSources(activeContent.content);
    const htmlParserOptions = getHtmlParserOptions(
      imageSources,
      togglePhotoSlider,
    );
    const parsedHtml = ReactHtmlParser(
      activeContent.content,
      htmlParserOptions,
    );
    const categoryId = activeContent.feed.category.id;
    const categoryTitle = activeContent.feed.category.title;

    return (
      <div
        className="article-content"
        onBlur={() => setIsArticleFocused(false)}
        onFocus={() => setIsArticleFocused(true)}
        ref={ref}
      >
        <div className="scroll-container">
          <div className="article-header" style={{ width: `${articleWidth}%` }}>
            <Typography.Title className="article-title" heading={5}>
              <a
                href={activeContent.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {activeContent.title}
              </a>
            </Typography.Title>
            <div className="article-meta">
              <Typography.Text>
                <CustomLink
                  url={`/feed/${activeContent.feed.id}`}
                  text={activeContent.feed.title}
                />
              </Typography.Text>
              <Typography.Text>{` - ${activeContent.author}`}</Typography.Text>
              <Typography.Text>
                <Tag
                  size="small"
                  onClick={() => {
                    navigate(`/category/${categoryId}`);
                  }}
                  style={{
                    marginLeft: "10px",
                    cursor: "pointer",
                  }}
                >
                  {categoryTitle}
                </Tag>
              </Typography.Text>
            </div>
            <Typography.Text className="article-date">
              {dayjs(activeContent.published_at).format(
                "dddd, MMMM D, YYYY [at] h:mm A",
              )}
            </Typography.Text>
            <Divider />
          </div>
          <div
            className="article-body"
            key={activeContent.id}
            style={{ fontSize: `${fontSize}rem`, width: `${articleWidth}%` }}
          >
            {parsedHtml}
            <PhotoSlider
              images={imageSources.map((item) => ({ src: item, key: item }))}
              visible={isPhotoSliderVisible}
              onClose={() => {
                setIsPhotoSliderVisible(false);
                setIsArticleFocused(true);
              }}
              index={selectedIndex}
              onIndexChange={setSelectedIndex}
            />
          </div>
        </div>
        <ActionButtons
          info={info}
          handleEntryClick={handleEntryClick}
          getEntries={getEntries}
          entryListRef={entryListRef}
          entryDetailRef={ref}
        />
      </div>
    );
  },
);

export default ArticleDetail;
