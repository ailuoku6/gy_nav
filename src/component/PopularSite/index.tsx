import React from "react";
//import './dark.css';
import Divider from "@material-ui/core/Divider";
import { useDispatch, useSelector } from "react-redux";

import { setPopularSite } from "../../redux/actions";
import {
  UIContainer,
  UITitle,
  SiteContainer,
  UISite,
  UISiteIcon,
  UISiteTitle,
} from "./style";

export default function PopularSite(props: any) {
  const { popularSite } = useSelector((state) => ({
    popularSite: state.PopularSite,
  }));
  const dispatch = useDispatch();

  let pts = popularSite.pSite;

  return (
    <UIContainer>
      <UITitle>常用站点</UITitle>
      <Divider />
      <SiteContainer>
        {pts.map((item, index) => {
          return (
            <div key={index}>
              <UISite>
                <a
                  style={{ textDecoration: "none" }}
                  href={item.url}
                  target="_blank"
                >
                  <UISiteIcon src={item.icon} alt={item.icon} />
                  <UISiteTitle>{item.site_name}</UISiteTitle>
                </a>
              </UISite>
            </div>
          );
        })}
      </SiteContainer>
    </UIContainer>
  );
}
