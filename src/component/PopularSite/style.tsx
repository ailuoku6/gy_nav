import styled from "styled-components";

export const UIHoverable = styled.div`
  -webkit-transition: -webkit-box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: -webkit-box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    -webkit-box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: box-shadow;
  &:hover {
    box-shadow: 0 5px 5px -3px rgb(0 0 0 / 20%), 0 8px 10px 1px rgb(0 0 0 / 14%),
      0 3px 14px 2px rgb(0 0 0 / 12%);
  }
`;

export const UIShadow = styled.div`
  -webkit-box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
`;

export const UIContainer = styled(UIShadow)`
  width: 96%;
  max-width: 1080px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding-right: 15px;
  padding-left: 15px;
  background-color: #fff;
  border-radius: 6px;
  margin: 22px auto;
  padding-bottom: 8px;

  @media screen and (min-width: 600px) {
    width: 94%;
  }
`;

export const SiteContainer = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;

  & > div {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 33%;
    height: 100%;
  }

  @media screen and (min-width: 960px) {
    & > div {
      width: 11%;
    }
  }
`;

export const UISite = styled(UIHoverable)`
  width: 75px;
  display: inline-block;
  height: 95px;
  text-align: center;
  margin: 0 2px;
  padding: 3px;
  border-radius: 6px;

  img {
    margin-bottom: -5px;
  }
`;

export const UISiteTitle = styled.span`
  text-align: center;
  white-space: nowrap;
  color: #000;;
`;

export const UISiteIcon = styled.img`
  width: 70px;
  height: 70px;
`;

export const UITitle = styled.div`
  display: inline-block;
  font-size: 1em;
  margin-top: 15px;
  margin-bottom: 10px;
  color: #0d47a1;
`;
