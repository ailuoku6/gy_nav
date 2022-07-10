import styled from "styled-components";
import { Paper } from "@material-ui/core";

const titleStyle = `
  display: inline-block;
  font-size: 1em;
  margin-top: 5px;
  margin-bottom: 5px;
  color: #0d47a1;
`;

export const UIPartition = styled(Paper)`
  min-height: 50px;
  padding: 10px;
  border-radius: 6px;

  ${titleStyle}
`;

export const UITitle = styled.div`
  ${titleStyle}
`;

export const UIEditWrap = styled.div`
  display: flex;
`;

export const UIContainer = styled.div`
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding-right: 8px;
  padding-left: 8px;
  margin-right: auto;
  margin-left: auto;
  margin-top: 10px;
  max-width: 1095px;
`;
