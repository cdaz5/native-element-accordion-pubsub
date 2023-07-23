import "./styles.css";
import React, { useEffect } from "react";
import styled from "styled-components";

const AccordionApiContext = React.createContext();

const useAccordionApi = () => {
  const ctx = React.useContext(AccordionApiContext);

  return ctx;
};

const Accordion = ({ oneAtATime, children, gap = "0" }) => {
  const subscribers = React.useRef({});

  const api = {
    oneAtATime,
    subscribe: (event, callback) => {
      let index;

      if (!subscribers.current[event]) {
        subscribers.current[event] = [];
      }

      index = subscribers.current[event].push(callback) - 1;

      return {
        unsubscribe: () => {
          subscribers.current = {
            ...subscribers.current,
            [event]: subscribers.current[event].splice(index, 1)
          };
        }
      };
    },
    publish: (event, data) => {
      if (!subscribers.current[event]) return;

      subscribers.current[event].forEach((subscriberCallback) =>
        subscriberCallback(data)
      );
    }
  };

  return (
    <AccordionApiContext.Provider value={api}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap
        }}
      >
        {children}
      </div>
    </AccordionApiContext.Provider>
  );
};

const PanelContext = React.createContext();

const PanelContextProvider = ({ children }) => {
  const refs = React.useRef({});

  const api = React.useMemo(
    () => ({
      refs,
      setRefData: (key, data) => {
        refs.current = {
          ...refs.current,
          [key]: data
        };
      }
    }),
    []
  );
  return <PanelContext.Provider value={api}>{children}</PanelContext.Provider>;
};

const usePanelState = () => {
  const ctx = React.useContext(PanelContext);

  return ctx;
};

const StyledSummary = styled.summary`
  padding: 8px;
  text-align: left;
  border: 1px solid var(--arrowColor);
  display: flex;
  align-items: center;
  border-radius: 8px;
`;

const StyledDetails = styled.details`
  --spacer: 8px;
  --arrow: 16px;
  --arrowColor: dodgerblue;

  display: flex;

  svg {
    width: var(--arrow);
    height: auto;
  }
`;

const Panel = ({ initIsOpen, children }) => {
  return (
    <PanelContextProvider>
      <InnerPanel initIsOpen={initIsOpen}>{children}</InnerPanel>
    </PanelContextProvider>
  );
};
const InnerPanel = ({ initIsOpen, children }) => {
  const id = React.useId();
  const ref = React.useRef(null);
  const { subscribe, publish, oneAtATime } = useAccordionApi();
  const { setRefData } = usePanelState();

  React.useEffect(() => {
    const sub = subscribe("open", (data) => {
      if (oneAtATime && ref.current.open && data.id !== id) {
        ref.current.removeAttribute("open");
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [subscribe, oneAtATime, id]);

  React.useEffect(() => {
    if (initIsOpen) {
      ref.current.setAttribute("open", true);
    }
  }, [initIsOpen]);
  return (
    <StyledDetails
      onToggle={(e) => {
        console.log("TOGGLE", e.currentTarget.open);

        publish(e.currentTarget.open ? "open" : "close", { id });
      }}
      id={id}
      ref={(el) => {
        ref.current = el;
        setRefData("details", { id, el });
      }}
    >
      {children}
    </StyledDetails>
  );
};

const Icon = () => {
  const { refs } = usePanelState();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLast, setIsLast] = React.useState(false);
  const { subscribe } = useAccordionApi();
  useEffect(() => {
    console.log({ refs: refs.current });
  });
  useEffect(() => {
    const openSub = subscribe("open", (data) => {
      setIsOpen(data.id === refs.current.details.id);
    });
    const closeSub = subscribe("close", (data) => {
      if (refs.current.details.open && data.id === refs.current.details.id)
        setIsOpen(false);
    });

    return () => {
      openSub.unsubscribe();
      closeSub.unsubscribe();
    };
  }, [refs, subscribe]);

  useEffect(() => {
    if (!refs.current.summary.el) return;

    setIsLast(refs.current.summary.el.lastChild.tagName === "svg");
  }, [refs]);

  return (
    <>
      <svg
        style={{
          margin: isLast ? "0 0 0 auto" : "0 8px 0 0",
          transform: isOpen ? "rotate(180deg)" : "rotate(0)"
        }}
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="var(--arrowColor)"
        class="bi bi-caret-up-fill"
        viewBox="0 0 16 16"
      >
        <path d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
      </svg>
    </>
  );
};

const Summary = ({ children }) => {
  const id = React.useId();
  const { setRefData } = usePanelState();

  const ref = React.useRef(null);

  return (
    <StyledSummary
      id={id}
      ref={(el) => {
        ref.current = el;
        setRefData("summary", { id, el });
      }}
    >
      {children}
    </StyledSummary>
  );
};

const Flex = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: ${({ iconLeft = true }) =>
    iconLeft
      ? `var(--spacer) calc(var(--spacer) * 2 + var(--arrow))`
      : "var(--spacer)"};
`;

export default function App() {
  return (
    <div className="App">
      <Accordion oneAtATime gap="8px">
        <Panel>
          <Summary>
            <Icon />
            hi
          </Summary>
          <Flex>hello</Flex>
        </Panel>
        <Panel>
          <Summary>
            <Icon />
            hi
          </Summary>
          <Flex>hello</Flex>
        </Panel>
        <Panel initIsOpen>
          <Summary>
            hi
            <Icon />
          </Summary>
          <Flex iconLeft={false}>hello</Flex>
        </Panel>
      </Accordion>
    </div>
  );
}
