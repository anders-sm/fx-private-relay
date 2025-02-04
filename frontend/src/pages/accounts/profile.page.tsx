import { Localized, useLocalization } from "@fluent/react";
import type { NextPage } from "next";
import { useEffect } from "react";
import { event as gaEvent } from "react-ga";
import styles from "./profile.module.scss";
import BottomBannerIllustration from "../../../../static/images/woman-couch-left.svg";
import checkIcon from "../../../../static/images/icon-check.svg";
import { Layout } from "../../components/layout/Layout";
import { useProfiles } from "../../hooks/api/profile";
import {
  AliasData,
  getAllAliases,
  getFullAddress,
  useAliases,
} from "../../hooks/api/aliases";
import { useUsers } from "../../hooks/api/user";
import { AliasList } from "../../components/dashboard/aliases/AliasList";
import { ProfileBanners } from "../../components/dashboard/ProfileBanners";
import { LinkButton } from "../../components/Button";
import { useRuntimeData } from "../../hooks/api/runtimeData";
import {
  getPremiumSubscribeLink,
  isPremiumAvailableInCountry,
} from "../../functions/getPlan";
import { useGaViewPing } from "../../hooks/gaViewPing";
import { trackPurchaseStart } from "../../functions/trackPurchase";
import { PremiumOnboarding } from "../../components/dashboard/PremiumOnboarding";
import { Onboarding } from "../../components/dashboard/Onboarding";
import { getRuntimeConfig } from "../../config";
import { SubdomainIndicator } from "../../components/dashboard/subdomain/SubdomainIndicator";
import { Tips } from "../../components/dashboard/tips/Tips";
import { clearCookie, getCookie } from "../../functions/cookies";
import { toast } from "react-toastify";
import { getLocale } from "../../functions/getLocale";
import { InfoTooltip } from "../../components/InfoTooltip";
import { AddonData } from "../../components/dashboard/AddonData";
import { useAddonData } from "../../hooks/addon";

const Profile: NextPage = () => {
  const runtimeData = useRuntimeData();
  const profileData = useProfiles();
  const userData = useUsers();
  const aliasData = useAliases();
  const addonData = useAddonData();
  const { l10n } = useLocalization();
  const bottomBannerSubscriptionLinkRef = useGaViewPing({
    category: "Purchase Button",
    label: "profile-bottom-promo",
  });

  useEffect(() => {
    // This cookie is set in `trackPurchaseStart()`
    const hasClickedPurchaseCookie = getCookie("clicked-purchase") === "true";
    if (hasClickedPurchaseCookie && profileData.data?.[0].has_premium) {
      gaEvent({
        // This used to be an event set by the server;
        // I kept that name even though it's now generated by the client
        // to ensure reports remain consistent:
        category: "server event",
        action: "fired",
        label: "user_purchased_premium",
      });
      clearCookie("clicked-purchase");
    }
  }, [profileData.data]);

  if (!userData.isValidating && userData.error) {
    document.location.assign(getRuntimeConfig().fxaLoginUrl);
  }

  const profile = profileData.data?.[0];
  const user = userData.data?.[0];
  if (
    !runtimeData.data ||
    !profile ||
    !user ||
    !aliasData.randomAliasData.data ||
    !aliasData.customAliasData.data
  ) {
    // TODO: Show a loading spinner?
    return null;
  }

  const setCustomSubdomain = async (customSubdomain: string) => {
    const response = await profileData.setSubdomain(customSubdomain);
    if (!response.ok) {
      toast(
        l10n.getString("error-subdomain-not-available-2", {
          unavailable_subdomain: customSubdomain,
        }),
        { type: "error" }
      );
    }
    addonData.sendEvent("subdomainClaimed", { subdomain: customSubdomain });
  };

  const allAliases = getAllAliases(
    aliasData.randomAliasData.data,
    aliasData.customAliasData.data
  );

  if (
    profile.has_premium &&
    profile.onboarding_state < getRuntimeConfig().maxOnboardingAvailable
  ) {
    const onNextStep = (step: number) => {
      profileData.update(profile.id, {
        onboarding_state: step,
      });
    };

    return (
      <>
        <AddonData
          aliases={allAliases}
          profile={profile}
          runtimeData={runtimeData.data}
          totalBlockedEmails={profile.emails_blocked}
          totalForwardedEmails={profile.emails_forwarded}
        />
        <Layout>
          <PremiumOnboarding
            profile={profile}
            onNextStep={onNextStep}
            onPickSubdomain={setCustomSubdomain}
          />
        </Layout>
      </>
    );
  }

  const createAlias = async (
    options:
      | { mask_type: "random" }
      | { mask_type: "custom"; address: string; blockPromotionals: boolean }
  ) => {
    try {
      const response = await aliasData.create(options);
      if (!response.ok) {
        throw new Error(
          "Immediately caught to land in the same code path as failed requests."
        );
      }
      addonData.sendEvent("aliasListUpdate");
    } catch (error) {
      toast(l10n.getString("error-mask-create-failed"), { type: "error" });
    }
  };

  const updateAlias = async (
    alias: AliasData,
    updatedFields: Partial<AliasData>
  ) => {
    try {
      const response = await aliasData.update(alias, updatedFields);
      if (!response.ok) {
        throw new Error(
          "Immediately caught to land in the same code path as failed requests."
        );
      }
    } catch (error) {
      toast(
        l10n.getString("error-mask-update-failed", {
          alias: getFullAddress(alias),
        }),
        { type: "error" }
      );
    }
  };

  const deleteAlias = async (alias: AliasData) => {
    try {
      const response = await aliasData.delete(alias);
      if (!response.ok) {
        throw new Error(
          "Immediately caught to land in the same code path as failed requests."
        );
      }
      addonData.sendEvent("aliasListUpdate");
    } catch (error: unknown) {
      toast(
        l10n.getString("error-mask-delete-failed", {
          alias: getFullAddress(alias),
        }),
        { type: "error" }
      );
    }
  };

  const subdomainMessage =
    typeof profile.subdomain === "string" ? (
      <>
        <span>{l10n.getString("profile-label-subdomain")}</span>
        <span className={styles["profile-registered-domain-value"]}>
          <SubdomainIndicator
            subdomain={profile.subdomain}
            onCreateAlias={(
              address: string,
              settings: { blockPromotionals: boolean }
            ) =>
              createAlias({
                mask_type: "custom",
                address: address,
                blockPromotionals: settings.blockPromotionals,
              })
            }
          />
        </span>
      </>
    ) : (
      <>
        <a className={styles["open-button"]} href="#mpp-choose-subdomain">
          {l10n.getString("profile-label-create-subdomain")}
        </a>
        <InfoTooltip
          alt={l10n.getString("profile-label-subdomain-tooltip-trigger")}
        >
          {l10n.getString("profile-label-subdomain-tooltip")}
        </InfoTooltip>
      </>
    );

  const numberFormatter = new Intl.NumberFormat(getLocale(l10n), {
    notation: "compact",
    compactDisplay: "short",
  });
  // Non-Premium users have only five aliases, making the stats less insightful,
  // so only show them for Premium users:
  const stats = profile.has_premium ? (
    <section className={styles.header}>
      <div className={styles["header-wrapper"]}>
        <div className={styles["user-details"]}>
          <Localized
            id="profile-label-welcome-html"
            vars={{
              email: user.email,
            }}
            elems={{
              span: <span className={styles.lead} />,
            }}
          >
            <span className={styles.greeting} />
          </Localized>
          <strong className={styles.subdomain}>
            <img src={checkIcon.src} alt="" />
            {subdomainMessage}
          </strong>
        </div>
        <dl className={styles["account-stats"]}>
          <div className={styles.stat}>
            <dt className={styles.label}>
              {l10n.getString("profile-stat-label-aliases-used-2")}
            </dt>
            <dd className={styles.value}>
              {numberFormatter.format(allAliases.length)}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.label}>
              {l10n.getString("profile-stat-label-blocked")}
            </dt>
            <dd className={styles.value}>
              {numberFormatter.format(profile.emails_blocked)}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.label}>
              {l10n.getString("profile-stat-label-forwarded")}
            </dt>
            <dd className={styles.value}>
              {numberFormatter.format(profile.emails_forwarded)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  ) : (
    <Localized
      id="profile-label-welcome-html"
      vars={{ email: user.email }}
      elems={{ span: <span /> }}
    >
      <section className={styles["no-premium-header"]} />
    </Localized>
  );

  const bottomPremiumSection =
    profile.has_premium ||
    !isPremiumAvailableInCountry(runtimeData.data) ? null : (
      <section className={styles["bottom-banner"]}>
        <div className={styles["bottom-banner-wrapper"]}>
          <div className={styles["bottom-banner-content"]}>
            <Localized
              id="banner-pack-upgrade-headline-2-html"
              elems={{ strong: <strong /> }}
            >
              <h3 />
            </Localized>
            <p>{l10n.getString("banner-pack-upgrade-copy-2")}</p>
            <LinkButton
              href={getPremiumSubscribeLink(runtimeData.data)}
              ref={bottomBannerSubscriptionLinkRef}
              onClick={() =>
                trackPurchaseStart({ label: "profile-bottom-promo" })
              }
            >
              {l10n.getString("banner-pack-upgrade-cta")}
            </LinkButton>
          </div>
          <img src={BottomBannerIllustration.src} alt="" />
        </div>
      </section>
    );

  const banners = (
    <section className={styles["banners-wrapper"]}>
      <ProfileBanners
        profile={profile}
        user={user}
        onCreateSubdomain={setCustomSubdomain}
        runtimeData={runtimeData.data}
        aliases={allAliases}
      />
    </section>
  );
  const topBanners = allAliases.length > 0 ? banners : null;
  const bottomBanners = allAliases.length === 0 ? banners : null;

  return (
    <>
      <AddonData
        aliases={allAliases}
        profile={profile}
        runtimeData={runtimeData.data}
        totalBlockedEmails={profile.emails_blocked}
        totalForwardedEmails={profile.emails_forwarded}
      />
      <Layout>
        <main className={styles["profile-wrapper"]}>
          {stats}
          {topBanners}
          <section className={styles["main-wrapper"]}>
            <Onboarding
              aliases={allAliases}
              onCreate={() => createAlias({ mask_type: "random" })}
            />
            <AliasList
              aliases={allAliases}
              onCreate={createAlias}
              onUpdate={updateAlias}
              onDelete={deleteAlias}
              profile={profile}
              user={user}
              runtimeData={runtimeData.data}
            />
            <p className={styles["size-information"]}>
              {l10n.getString("profile-supports-email-forwarding", {
                size: getRuntimeConfig().emailSizeLimitNumber,
                unit: getRuntimeConfig().emailSizeLimitUnit,
              })}
            </p>
          </section>
          {bottomBanners}
        </main>
        <aside>{bottomPremiumSection}</aside>
        <Tips profile={profile} />
      </Layout>
    </>
  );
};

export default Profile;
