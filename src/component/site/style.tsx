import styled from "styled-components";

export const UIHoverable = styled.div`
  -webkit-transition: -webkit-box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: -webkit-box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    -webkit-box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: box-shadow;

  &:hover {
    -webkit-box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
      0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
      0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
  }
`;

export const UIDelMenu = styled.div`
  @keyframes menutrans {
    from {
      height: 0;
    }
    to {
      height: 100%;
    }
  }

  @-webkit-keyframes menutrans /*Safari and Chrome*/ {
    from {
      height: 0;
    }
    to {
      height: 100%;
    }
  }
  position: absolute;
  display: none;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  /*background: rgba(214, 230, 236, 0.5);*/
  overflow: hidden;
  animation: menutrans 100ms linear;
  -webkit-animation: menutrans 200ms linear; /*Safari and Chrome*/
`;

export const UISiteNoIcon = styled(UIHoverable)`
  position: relative;
  display: inline-block;
  padding: 5px 10px;
  margin: 5px 5px 0 0;
  text-align: center;
  border-radius: 6px;

  &:hover a {
    color: #e65100;
    text-decoration: underline;
  }

  &:hover ${UIDelMenu} {
    display: flex;
  }
`;

export const UIOperatorBtnWrap = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border-radius: 5px;
`;
