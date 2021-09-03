import React from "react";
import luntan from "../../assets/bbs.png";

import { UIFooter, UIAboutWrap, UIBeianWrap, UIImage, UILink } from "./style";

export default function Footer(props:any){
    return (
        <UIFooter>
        <UIAboutWrap>
          <UIBeianWrap>
            BY
            <UILink href="http://weibo.com/ailuoku6" target="_blank">
              @爱咯酷6
            </UILink>
            | 论坛:
            <UILink href="http://bbs.ailuoku6.top" target="_blank">
              <UIImage alt={""} src={luntan} />
            </UILink>
          </UIBeianWrap>
          网站备案号:
          <UILink href="http://www.beian.miit.gov.cn/" target="_blank">
            桂ICP备18003700号
          </UILink>
          <UIBeianWrap></UIBeianWrap>
        </UIAboutWrap>
      </UIFooter>
    )
}
