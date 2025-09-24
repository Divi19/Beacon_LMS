import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const mockNavigate = jest.fn();

jest.mock("../../../components/InstructorTopBar/InstructorTopBar", () => ({
  __esModule: true,
  default: () => <div>Mocked InstructorTopBar</div>,
}));

jest.mock("axios");

import InstructorCourseCreate from "./InstructorCourseCreate";

describe("InstructorCourseCreate", () => {
  const renderComponent = (props = {}) =>
    render(<InstructorCourseCreate {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders all form inputs and buttons", () => {
    renderComponent();

    expect(screen.getByLabelText(/Course Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course Credits/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course Director/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

    expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Discard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create/i })).toBeInTheDocument();
  });

  test("updates input values correctly", () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Course Title/i), {
      target: { value: "Algorithms 101" },
    });
    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: "CS101" },
    });
    fireEvent.change(screen.getByLabelText(/Course Credits/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/Course Director/i), {
      target: { value: "Dr. Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Intro to algorithms" },
    });

    expect(screen.getByDisplayValue("Algorithms 101")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CS101")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dr. Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Intro to algorithms")).toBeInTheDocument();
  });

  test("adds new lessons when + button is clicked", () => {
    renderComponent();

    const addButton = screen.getByRole("button", { name: "+" });
    fireEvent.click(addButton);

    expect(screen.getByText(/Lesson 2/i)).toBeInTheDocument();
  });

  test("submits form successfully and shows success modal", async () => {
    axios.post.mockResolvedValueOnce({});

    const onCourseCreated = jest.fn();
    renderComponent({ onCourseCreated });

    fireEvent.change(screen.getByLabelText(/Course Title/i), {
      target: { value: "Algorithms 101" },
    });
    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: "CS101" },
    });
    fireEvent.change(screen.getByLabelText(/Course Credits/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/Course Director/i), {
      target: { value: "Dr. Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Intro to algorithms" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() =>
      expect(screen.getByText(/Course Created Successfully/i)).toBeInTheDocument()
    );

    expect(onCourseCreated).toHaveBeenCalled();
  });

  test("handles API error on form submit", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));
    jest.spyOn(window, "alert").mockImplementation(() => {});

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Course Title/i), {
      target: { value: "Fail Course" },
    });
    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: "FAIL101" },
    });
    fireEvent.change(screen.getByLabelText(/Course Credits/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/Course Director/i), {
      target: { value: "Prof. Error" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "This will fail" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
  });

  test("discard button resets form and lessons", () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Course Title/i), {
      target: { value: "Temp Course" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Discard/i }));

    expect(screen.queryByDisplayValue("Temp Course")).not.toBeInTheDocument();
    expect(screen.queryByText(/Lesson 1/i)).not.toBeInTheDocument();
  });

  test("navigates to course page after success modal", async () => {
    axios.post.mockResolvedValueOnce({});

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Course Title/i), {
      target: { value: "Algorithms 101" },
    });
    fireEvent.change(screen.getByLabelText(/Course ID/i), {
      target: { value: "CS101" },
    });
    fireEvent.change(screen.getByLabelText(/Course Credits/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/Course Director/i), {
      target: { value: "Dr. Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Intro to algorithms" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create/i }));

    await waitFor(() =>
      expect(screen.getByText(/Course Created Successfully/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Go to course page/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/instructor/course-list");
  });
});