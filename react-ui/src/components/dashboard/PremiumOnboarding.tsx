import { useState } from "react";
import { useLocalization } from "@fluent/react";
import { event as gaEvent } from "react-ga";
import { useOverlayTriggerState } from "react-stately";
import styles from "./PremiumOnboarding.module.scss";
import checkIcon from "../../../../static/images/icon-check.svg";
import WomanOnCouch from "../../../../static/images/dashboard-onboarding/woman-couch.svg";
import ManLaptopEmail from "../../../../static/images/dashboard-onboarding/man-laptop-email-alt.svg";
import WomanEmail from "../../../../static/images/dashboard-onboarding/woman-email.svg";
import { Button, LinkButton } from "../Button";
import { useGaPing } from "../../hooks/gaPing";
import { ProfileData } from "../../hooks/api/profile";
import { SubdomainSearchForm } from "./subdomain/SearchForm";
import { SubdomainConfirmationModal } from "./subdomain/ConfirmationModal";
import { VisuallyHidden } from "react-aria";

export type Props = {
  profile: ProfileData;
  onNextStep: (step: number) => void;
  onPickSubdomain: (subdomain: string) => void;
};

export const PremiumOnboarding = (props: Props) => {
  const { l10n } = useLocalization();
  const getStartedButtonRef = useGaPing({
    category: "Premium Onboarding",
    label: "onboarding-step-1-continue",
  });
  const skipDomainButtonRef = useGaPing({
    category: "Premium Onboarding",
    label: "onboarding-step-2-skip",
  });
  const continueWithDomainButtonRef = useGaPing({
    category: "Premium Onboarding",
    label: "onboarding-step-2-continue",
  });
  const skipAddonButtonRef = useGaPing({
    category: "Premium Onboarding",
    label: "onboarding-step-3-skip",
  });
  const continueWithAddonButtonRef = useGaPing({
    category: "Premium Onboarding",
    label: "onboarding-step-3-continue",
  });

  const quit = () => {
    props.onNextStep(
      Number.parseInt(process.env.NEXT_PUBLIC_MAX_ONBOARDING_AVAILABLE!, 10)
    );
    gaEvent({
      category: "Premium Onboarding",
      action: "Engage",
      label: "onboarding-skip",
    });
  };

  let step = null;
  let button = null;
  if (props.profile.onboarding_state === 0) {
    step = <StepOne />;

    const getStarted = () => {
      props.onNextStep(1);
      gaEvent({
        category: "Premium Onboarding",
        action: "Engage",
        label: "onboarding-step-1-continue",
      });
    };

    button = (
      <Button ref={getStartedButtonRef} onClick={getStarted}>
        {l10n.getString("multi-part-onboarding-premium-welcome-button-start")}
      </Button>
    );
  }

  if (props.profile.onboarding_state === 1) {
    step = (
      <StepTwo
        profile={props.profile}
        onPickSubdomain={props.onPickSubdomain}
      />
    );

    if (typeof props.profile.subdomain !== "string") {
      const skipDomain = () => {
        props.onNextStep(2);
        gaEvent({
          category: "Premium Onboarding",
          action: "Engage",
          label: "onboarding-step-2-skip",
        });
      };

      button = (
        <button
          ref={skipDomainButtonRef}
          onClick={skipDomain}
          className={styles.skipLink}
        >
          {l10n.getString("multi-part-onboarding-premium-domain-button-skip")}
        </button>
      );
    } else {
      const getAddon = () => {
        props.onNextStep(2);
        gaEvent({
          category: "Premium Onboarding",
          action: "Engage",
          label: "onboarding-step-2-continue",
        });
      };
      button = (
        <Button ref={continueWithDomainButtonRef} onClick={getAddon}>
          {l10n.getString("profile-label-continue")}
        </Button>
      );
    }
  }

  if (props.profile.onboarding_state === 2) {
    step = <StepThree />;

    const skipAddon = () => {
      props.onNextStep(3);
      gaEvent({
        category: "Premium Onboarding",
        action: "Engage",
        label: "onboarding-step-3-skip",
      });
    };
    const goToDashboard = () => {
      props.onNextStep(3);
      gaEvent({
        category: "Premium Onboarding",
        action: "Engage",
        label: "onboarding-step-3-continue",
      });
    };

    button = (
      <>
        <Button
          ref={continueWithAddonButtonRef}
          onClick={goToDashboard}
          className={`is-visible-with-addon ${styles.goToDashboardButton}`}
        >
          {l10n.getString(
            "multi-part-onboarding-premium-extension-button-dashboard"
          )}
        </Button>
        <button
          ref={skipAddonButtonRef}
          onClick={skipAddon}
          className={`is-hidden-with-addon ${styles.getAddonButton} ${styles.skipLink}`}
        >
          {l10n.getString(
            "multi-part-onboarding-premium-extension-button-skip"
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <section className={styles.onboarding}>
        {step}
        <div className={styles.controls}>
          {button}
          {/*
            Unfortunately <progress> is hard to style like we want, even though it expresses what we want.
            Thus, we render a <progress> for machines, and hide the styled elements for them.
          */}
          <VisuallyHidden>
            <progress
              max={process.env.NEXT_PUBLIC_MAX_ONBOARDING_AVAILABLE}
              value={props.profile.onboarding_state + 1}
            >
              {l10n.getString("multi-part-onboarding-step-counter", {
                step: props.profile.onboarding_state,
                max: Number.parseInt(
                  process.env.NEXT_PUBLIC_MAX_ONBOARDING_AVAILABLE!,
                  10
                ),
              })}
            </progress>
          </VisuallyHidden>
          <ol className={styles.styledProgressBar} aria-hidden={true}>
            <li
              className={
                props.profile.onboarding_state >= 0
                  ? styles.isCompleted
                  : undefined
              }
            >
              <span></span>1
            </li>
            <li
              className={
                props.profile.onboarding_state >= 1
                  ? styles.isCompleted
                  : undefined
              }
            >
              <span></span>2
            </li>
            <li
              className={
                props.profile.onboarding_state >= 2
                  ? styles.isCompleted
                  : undefined
              }
            >
              <span></span>3
            </li>
          </ol>
          <button className={styles.skipLink} onClick={() => quit()}>
            {l10n.getString("profile-label-skip")}
          </button>
        </div>
      </section>
    </>
  );
};

const StepOne = () => {
  const { l10n } = useLocalization();

  return (
    <div className={`${styles.step} ${styles.stepWelcome}`}>
      <div>
        <h2>
          {l10n.getString("multi-part-onboarding-premium-welcome-headline")}
        </h2>
        <p className={styles.lead}>
          {l10n.getString("multi-part-onboarding-premium-welcome-subheadline")}
        </p>
      </div>
      <div className={styles.description}>
        <img src={WomanOnCouch.src} alt="" width={350} />
        <p>
          <strong>
            {l10n.getString("multi-part-onboarding-premium-welcome-title")}
          </strong>
          <br />
          {l10n.getString("onboarding-premium-control-description")}
        </p>
      </div>
    </div>
  );
};

type Step2Props = {
  profile: ProfileData;
  onPickSubdomain: (subdomain: string) => void;
};
const StepTwo = (props: Step2Props) => {
  const { l10n } = useLocalization();

  const subdomain =
    typeof props.profile.subdomain === "string" ? (
      <div className={styles.actionComplete}>
        <img src={checkIcon.src} alt="" width={18} />
        <samp>
          @{props.profile.subdomain}.{process.env.NEXT_PUBLIC_MOZMAIL_DOMAIN}
        </samp>
      </div>
    ) : (
      <Step2SubdomainPicker onPickSubdomain={props.onPickSubdomain} />
    );

  return (
    <div className={`${styles.step} ${styles.stepCustomDomain}`}>
      <div>
        <h2>
          {l10n.getString("multi-part-onboarding-premium-domain-headline")}
        </h2>
        <p className={styles.lead}>
          {l10n.getString("multi-part-onboarding-premium-welcome-subheadline")}
        </p>
      </div>
      <div className={styles.description}>
        <img src={ManLaptopEmail.src} alt="" width={500} />
        <div>
          <p className={styles.subdomainDescription}>
            <strong>
              {l10n.getString("multi-part-onboarding-premium-domain-title")}
            </strong>
            <br />
            {l10n.getString("banner-register-subdomain-copy", {
              mozmail: "mozmail.com",
            })}
          </p>
          <div>{subdomain}</div>
        </div>
      </div>
    </div>
  );
};

type Step2SubdomainPickerProps = {
  onPickSubdomain: (subdomain: string) => void;
};
const Step2SubdomainPicker = (props: Step2SubdomainPickerProps) => {
  const { l10n } = useLocalization();
  const [chosenSubdomain, setChosenSubdomain] = useState("");

  const modalState = useOverlayTriggerState({});

  const onPick = (subdomain: string) => {
    setChosenSubdomain(subdomain);
    modalState.open();
  };

  const onConfirm = () => {
    props.onPickSubdomain(chosenSubdomain);
    modalState.close();
  };

  const dialog = modalState.isOpen ? (
    <SubdomainConfirmationModal
      subdomain={chosenSubdomain}
      isOpen={modalState.isOpen}
      onClose={() => modalState.close()}
      onConfirm={onConfirm}
    />
  ) : null;

  return (
    <>
      <p className={styles.subdomainPickerHeading}>
        {l10n.getString("multi-part-onboarding-premium-domain-cta")}
      </p>
      <samp className={styles.domainExample}>
        ***@
        <span className={styles.customizablePart}>
          {l10n.getString("banner-register-subdomain-example-address")}
        </span>
        .{process.env.NEXT_PUBLIC_MOZMAIL_DOMAIN}
      </samp>
      <SubdomainSearchForm onPick={onPick} />
      {dialog}
    </>
  );
};

const StepThree = () => {
  const { l10n } = useLocalization();

  return (
    <div className={`${styles.step} ${styles.stepAddon}`}>
      <div>
        <h2>
          {l10n.getString("multi-part-onboarding-premium-extension-headline")}
        </h2>
        <p className={styles.lead}>
          {l10n.getString("multi-part-onboarding-premium-welcome-subheadline")}
        </p>
      </div>
      <div className={styles.description}>
        <img src={WomanEmail.src} alt="" width={400} />
        <div>
          <p>
            <strong>
              {l10n.getString(
                "multi-part-onboarding-premium-extension-reply-title"
              )}
            </strong>
            <br />
            {l10n.getString("onboarding-premium-reply-description")}
          </p>
          <div className={`${styles.addonDescription} is-hidden-with-addon`}>
            <h3>
              {l10n.getString(
                "multi-part-onboarding-premium-extension-get-title"
              )}
            </h3>
            <p>
              {l10n.getString(
                "multi-part-onboarding-premium-extension-get-description"
              )}
            </p>
            <LinkButton
              href="https://addons.mozilla.org/firefox/addon/private-relay/?utm_source=fx-relay&utm_medium=onboarding&utm_campaign=install-addon"
              target="_blank"
              className={styles.getAddonButton}
            >
              {l10n.getString(
                "multi-part-onboarding-premium-extension-button-download"
              )}
            </LinkButton>
          </div>
          <div className={`${styles.addonDescription} is-visible-with-addon`}>
            <div className={styles.actionComplete}>
              <img src={checkIcon.src} alt="" width={18} />
              {l10n.getString("multi-part-onboarding-premium-extension-added")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};