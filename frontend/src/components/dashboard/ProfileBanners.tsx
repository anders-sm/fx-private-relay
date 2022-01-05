import { useLocalization } from "@fluent/react";
import { ReactNode } from "react";
import styles from "./ProfileBanners.module.scss";
import FirefoxLogo from "../../../../static/images/logos/fx-logo.svg";
import AddonIllustration from "../../../../static/images/banner-addon.svg";
import RelayLogo from "../../../../static/images/placeholder-logo.svg";
import {
  getPremiumSubscribeLink,
  isPremiumAvailableInCountry,
} from "../../functions/getPlan";
import { isUsingFirefox } from "../../functions/userAgent";
import { ProfileData } from "../../hooks/api/profile";
import { PremiumCountriesData } from "../../hooks/api/premiumCountries";
import { Banner } from "../Banner";

export type Props = {
  profile: ProfileData;
  premiumCountries?: PremiumCountriesData;
};

export const ProfileBanners = (props: Props) => {
  const { l10n } = useLocalization();
  const banners: ReactNode[] = [];

  if (!isUsingFirefox()) {
    banners.push(
      <Banner
        key="firefox-banner"
        type="promo"
        title={l10n.getString("banner-download-firefox-headline")}
        illustration={
          <img src={FirefoxLogo.src} alt="" width={60} height={60} />
        }
        cta={{
          target:
            "https://www.mozilla.org/firefox/new/?utm_source=fx-relay&utm_medium=banner&utm_campaign=download-fx",
          content: l10n.getString("banner-download-firefox-cta"),
        }}
      >
        <p>{l10n.getString("banner-download-firefox-copy")}</p>
      </Banner>
    );
  }

  if (isUsingFirefox()) {
    // This pushes a banner promoting the add-on - detecting the add-on
    // and determining whether to show it based on that is a bit slow,
    // so we'll just let the add-on hide it:
    banners.push(
      <Banner
        key="addon-banner"
        type="promo"
        title={l10n.getString("banner-download-install-extension-headline")}
        illustration={
          <img src={AddonIllustration.src} alt="" width={60} height={60} />
        }
        cta={{
          target:
            "https://addons.mozilla.org/firefox/addon/private-relay/?utm_source=fx-relay&utm_medium=banner&utm_campaign=install-addon",
          content: l10n.getString("banner-download-install-extension-cta"),
        }}
        hiddenWithAddon={true}
      >
        <p>{l10n.getString("banner-download-install-extension-copy")}</p>
      </Banner>
    );
  }

  if (
    !props.profile.has_premium &&
    isPremiumAvailableInCountry(props.premiumCountries)
  ) {
    banners.push(
      <Banner
        key="premium-banner"
        type="promo"
        title={l10n.getString("banner-upgrade-headline")}
        illustration={<img src={RelayLogo.src} alt="" width={60} height={60} />}
        cta={{
          target: getPremiumSubscribeLink(props.premiumCountries),
          content: l10n.getString("banner-upgrade-cta"),
        }}
      >
        <p>{l10n.getString("banner-upgrade-copy")}</p>
      </Banner>
    );
  }

  return <div className={styles.profileBanners}>{banners}</div>;
};