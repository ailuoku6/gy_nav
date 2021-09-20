import styled, { css } from "styled-components";
import { Collapse } from "@material-ui/core";

const headBarSize = [
  { minWidthQuery: 768, height: 90 },
  { minWidthQuery: 1024, height: 110 },
];

const searchingBarSize = [
  { minWidthQuery: 320, width: 160 },
  { minWidthQuery: 375, width: 212 },
  { minWidthQuery: 425, width: 268 },
  { minWidthQuery: 600, width: 319 },
  { minWidthQuery: 768, width: 500 },
  { minWidthQuery: 960, width: 470 },
  { minWidthQuery: 1024, width: 500 },
  { minWidthQuery: 1200, width: 680 },
  { minWidthQuery: 1440, width: 680 },
  { minWidthQuery: 1920, width: 850 },
];

const generateMediaQuery = ({
  $querySize,
  $height,
  $width,
}: {
  $querySize: number;
  $height?: number;
  $width?: number;
}) => {
  return css`
    @media screen and (min-width: ${$querySize}px) {
      ${$width
        ? css`
            width: ${$width}px;
          `
        : ""}
      ${$height
        ? css`
            height: ${$height}px;
          `
        : ""}
    }
  `;
};

// eslint-disable-next-line no-unexpected-multiline
export const UIHeadBar = styled.div<{
  $hoverble: boolean;
  $showShadow: boolean;
}>`
  width: 100%;
  display: flex;
  position: fixed;
  justify-content: center;
  align-items: center;
  top: 0;
  height: 70px;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  background-color: #fff;
  z-index: 100;

  ${(props) =>
    props.$hoverble
      ? css`
          transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: box-shadow;
          &:hover {
            box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
              0 8px 10px 1px rgba(0, 0, 0, 0.14),
              0 3px 14px 2px rgba(0, 0, 0, 0.12);
          }
        `
      : ""}

  ${(props) =>
    props.$showShadow
      ? css`
          box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
            0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
        `
      : ""}

${headBarSize.map((item) =>
    generateMediaQuery({
      $querySize: item.minWidthQuery,
      $height: item.height,
    })
  )}
`;

export const UISearchWrap = styled.div<{ $borderColor: string }>`
  text-align: center;
  border: 0.5px solid #3f51b5;
  outline: 0;
  background-color: #fff;
  border-color: ${(props) => props.$borderColor};
`;

export const UISearchMarchine = styled.div`
  display: inline-block;
  margin-left: 3px;
  margin-right: 0;
`;

export const UIMarchineItem = styled.a<{ $selected: boolean }>`
  text-decoration: none;
  font-size: 14px;
  ${(props) =>
    props.$selected
      ? css`
          background-color: #74b3b2;
          color: #fff;
        `
      : ""}
`;

export const UICollapse = styled(Collapse)`
  width: 50%;
  position: absolute;
  background-color: #fafafa;
  box-shadow: 0 2px 6px 0 rgba(63, 81, 181, 0.5);
  margin: 0;
  padding: 0;
  border-radius: 6px;

  margin-left: -4px;
  margin-top: 9px;
  width: 70px;

  & ${UIMarchineItem} {
    height: 25px;
    line-height: 25px;
    text-align: left;
    padding-left: 6px;
    font-size: 16px;
    display: block;
    white-space: nowrap;
    overflow: hidden;

    :hover {
      background-color: #828593;
      color: #fff;
    }
    :first-child {
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
    }
    :last-child {
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
    }
  }
`;

export const UISeacingBarWrap = styled.div`
  display: inline-flex;
  flex-wrap: nowrap;
  width: 120px;
  height: 32px;
  margin-bottom: -12.5px;
  overflow: hidden;

  ${searchingBarSize.map((item) =>
    generateMediaQuery({ $querySize: item.minWidthQuery, $width: item.width })
  )}
`;

export const UIInputBarWrap = styled.input`
  padding: 0;
  display: inline-block;
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  font-size: 14px;
`;

export const ClearBtnWrap = styled.div`
  display: flex;
  align-items: center;
  font-size: 15px;
`;

export const UISugItem = styled.a<{ $selected: boolean }>`
  text-decoration: none;
  ${(props) =>
    props.$selected
      ? css`
          background-color: #74b3b2;
          color: #fff;
        `
      : ""}
`;

export const UISugWrap = styled.ul<{ $width?: number }>`
  width: ${(props) => (props.$width ? props.$width + "px" : "50%")};
  position: absolute;
  background-color: #fafafa;
  box-shadow: 0 2px 6px 0 rgba(63, 81, 181, 0.5);
  margin: 0;
  padding: 0;
  border-radius: 6px;

  & ${UISugItem} {
    height: 25px;
    line-height: 25px;
    text-align: left;
    padding-left: 6px;
    font-size: 16px;
    display: block;
    white-space: nowrap;
    overflow: hidden;

    :hover {
      background-color: #828593;
      color: #fff;
    }

    :first-child {
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
    }

    :last-child {
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px;
    }
  }
`;

export const UISugIndex = styled.div<{ $hot: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  width: 16px;
  background-color: ${(props) => (props.$hot ? "#3b4042" : "#afaea0")};
  border-radius: 50%;
  font-size: 12px;
  margin-right: 5px;
  color: #fff;
`;

export const UISearchingBtn = styled.div<{ $backColor?: string }>`
  border-radius: 0;
  position: relative;
  display: inline-block;
  width: 88px;
  height: 36px;
  box-sizing: border-box;
  padding: 0 16px;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  line-height: 36px;
  color: inherit;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  vertical-align: middle;
  touch-action: manipulation;
  cursor: pointer;
  user-select: none;
  background: 0 0;
  border: none;
  border-radius: 2px;
  outline: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 1, 1);
  will-change: box-shadow;
  -webkit-user-drag: none;
  color: #fff;
  background-color: ${(props) =>
    props.$backColor ? props.$backColor : "#3f51b5"};

  :hover {
    opacity: 0.87;
  }
`;
