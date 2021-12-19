import styled from "styled-components";

export const UIFooter = styled.footer`
  height: 100px;
  background-color: #2f2f29;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  width: 100%;
`;

export const UIAboutWrap = styled.div`
  color: #fff;
  text-align: center;
`;

export const UIImage = styled.image`
  height: 32px;
  margin-bottom: -10px;
`;

export const UILink = styled.a`
  text-decoration: none;
  color: #fff;
`;

export const UIBeianWrap = styled.div`
  & a:hover {
    text-decoration: underline;
  }
`;
