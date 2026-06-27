import { render, screen } from "@testing-library/react";
import GroupTable from "@/components/groups/GroupTable";
import type { Group } from "@/lib/types/group";

const mockGroup: Group = {
  name: "A",
  teams: [],
  standings: [
    {
      position: 1,
      team: {
        id: 1,
        name: "Brazil",
        code: "BRA",
        iso2: "br",
        flag: "https://flagcdn.com/w40/br.png",
        pastChampionships: 5,
        group: "A",
      },
      played: 3,
      won: 2,
      drawn: 1,
      lost: 0,
      goalsFor: 5,
      goalsAgainst: 2,
      goalDifference: 3,
      points: 7,
    },
    {
      position: 2,
      team: {
        id: 2,
        name: "Germany",
        code: "GER",
        iso2: "de",
        flag: "https://flagcdn.com/w40/de.png",
        pastChampionships: 4,
        group: "A",
      },
      played: 3,
      won: 2,
      drawn: 0,
      lost: 1,
      goalsFor: 4,
      goalsAgainst: 3,
      goalDifference: 1,
      points: 6,
    },
  ],
};

const expectedTooltips: Record<string, string> = {
  P: "Played: Number of matches played",
  W: "Won: Number of matches won",
  D: "Drawn: Number of matches drawn",
  L: "Lost: Number of matches lost",
  GF: "Goals For: Total goals scored",
  GA: "Goals Against: Total goals conceded",
  GD: "Goal Difference: Goals scored minus goals conceded",
  Pts: "Points: 3 for a win, 1 for a draw, 0 for a loss",
};

describe("GroupTable", () => {
  it("renders the group name header", () => {
    render(<GroupTable group={mockGroup} />);
    expect(screen.getByText("Group A")).toBeInTheDocument();
  });

  it("renders all 8 abbreviated headers with tooltip triggers", () => {
    render(<GroupTable group={mockGroup} />);
    const abbreviations = ["P", "W", "D", "L", "GF", "GA", "GD", "Pts"];
    abbreviations.forEach((abbr) => {
      expect(screen.getByText(abbr)).toBeInTheDocument();
    });
  });

  it("renders ? indicator next to each abbreviated header", () => {
    render(<GroupTable group={mockGroup} />);
    // There should be 8 ? indicators (one per abbreviated header)
    const questionMarks = screen.getAllByText("?");
    expect(questionMarks.length).toBe(8);
    questionMarks.forEach((qm) => {
      expect(qm).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("each tooltip contains the correct expanded text", () => {
    render(<GroupTable group={mockGroup} />);
    Object.entries(expectedTooltips).forEach(([abbr, tooltipText]) => {
      expect(screen.getByText(tooltipText)).toBeInTheDocument();
    });
  });

  it("aria-describedby is correctly wired between headers and tooltips", () => {
    render(<GroupTable group={mockGroup} />);
    // Each Tooltip renders a trigger span with aria-describedby and a tooltip div with matching ID
    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips.length).toBe(8);
    tooltips.forEach((tooltip) => {
      const tooltipId = tooltip.getAttribute("id");
      expect(tooltipId).toBeTruthy();
      // Find the trigger that references this tooltip
      const trigger = document.querySelector(`[aria-describedby="${tooltipId}"]`);
      expect(trigger).toBeInTheDocument();
    });
  });

  it("renders team data correctly", () => {
    render(<GroupTable group={mockGroup} />);
    expect(screen.getByText("Brazil")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
  });

  it("renders multiple group tables consistently", () => {
    const groupB: Group = {
      ...mockGroup,
      name: "B",
      standings: mockGroup.standings.map((s) => ({
        ...s,
        team: { ...s.team, id: s.team.id + 100, name: s.team.name + " B" },
      })),
    };
    render(
      <>
        <GroupTable group={mockGroup} />
        <GroupTable group={groupB} />
      </>
    );
    // Both groups should have all 8 tooltips
    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips.length).toBe(16); // 8 per group × 2 groups
  });

  it("table has correct aria-label", () => {
    render(<GroupTable group={mockGroup} />);
    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-label", "Group A standings");
  });

  it("table uses table-fixed for proper column width constraint", () => {
    render(<GroupTable group={mockGroup} />);
    const table = screen.getByRole("table");
    expect(table).toHaveClass("table-fixed");
  });

  it("truncates long team names with ellipsis", () => {
    const longNameGroup: Group = {
      name: "Z",
      teams: [],
      standings: [
        {
          position: 1,
          team: {
            id: 999,
            name: "Republic of the Congo-Brazzaville",
            code: "CGO",
            iso2: "cg",
            flag: "https://flagcdn.com/w40/cg.png",
            pastChampionships: 0,
            group: "Z",
          },
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        },
      ],
    };
    render(<GroupTable group={longNameGroup} />);
    const teamNameSpan = screen.getByText("Republic of the Congo-Brazzaville");
    // The span should have the truncate class which applies text-overflow: ellipsis
    expect(teamNameSpan).toHaveClass("truncate");
    // The parent td should have min-w-0 to allow shrinking
    const teamCell = teamNameSpan.closest("td");
    expect(teamCell).toBeTruthy();
    expect(teamCell?.className).toContain("min-w-0");
    // The flex container should also have min-w-0
    const flexContainer = teamNameSpan.parentElement;
    expect(flexContainer).toBeTruthy();
    expect(flexContainer?.className).toContain("min-w-0");
  });
});
