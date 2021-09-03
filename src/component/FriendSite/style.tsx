import styled from "styled-components";

export const UIShadow = styled.div`
  -webkit-box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
`;

export const FriendSiteWrap = styled(UIShadow)`
  background-color: #dfdfdf;
  margin-top: 20px;
  padding-top: 10px;
  padding-left: 20px;
  padding-bottom: 10px;
  padding-right: 20px;
  color: #000;
  font-size: 13px;
`;
