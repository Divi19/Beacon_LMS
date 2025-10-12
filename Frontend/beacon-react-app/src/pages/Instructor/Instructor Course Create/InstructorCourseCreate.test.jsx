import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api";

const mockNavigate = jest.fn();

jest.mock("../../../components/InstructorTopBar/InstructorTopBar", () => ({
    __esModule: true,
    default: () => <div>Mock InstructorTopBar</div>,
}));

jest.mock("../../../api");

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

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
        expect(screen.getByLabelText(/Course Code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Course Director/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Number of Lessons/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Course Status/i)).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /Discard/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Create/i }),
        ).toBeInTheDocument();
    });

    test("updates input values correctly", () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Course Title/i), {
            target: { value: "Algorithms 101" },
        });
        fireEvent.change(screen.getByLabelText(/Course Code/i), {
            target: { value: "CS101" },
        });
        fireEvent.change(screen.getByLabelText(/Course Director/i), {
            target: { value: "Dr. Smith" },
        });
        fireEvent.change(screen.getByLabelText(/Description/i), {
            target: { value: "Intro to algorithms" },
        });
        fireEvent.change(screen.getByLabelText(/Number of Lessons/i), {
            target: { value: "5" },
        });
        fireEvent.change(screen.getByLabelText(/Course Status/i), {
            target: { value: "Inactive" },
        });

        expect(screen.getByDisplayValue("Algorithms 101")).toBeInTheDocument();
        expect(screen.getByDisplayValue("CS101")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Dr. Smith")).toBeInTheDocument();
        expect(
            screen.getByDisplayValue("Intro to algorithms"),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("5")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Inactive")).toBeInTheDocument();
    });

    test("submits form successfully and shows success modal", async () => {
        // Prevent error
        api.post.mockResolvedValue({ data: { course_id: "CS101" } });

        const onCourseCreated = jest.fn();
        renderComponent({ onCourseCreated });

        fireEvent.change(screen.getByLabelText(/Course Title/i), {
            target: { value: "Algorithms 101" },
        });
        fireEvent.change(screen.getByLabelText(/Course Code/i), {
            target: { value: "CS101" },
        });
        fireEvent.change(screen.getByLabelText(/Course Director/i), {
            target: { value: "1" },
        });
        fireEvent.change(screen.getByLabelText(/Description/i), {
            target: { value: "Intro to algorithms" },
        });
        fireEvent.change(screen.getByLabelText(/Number of Lessons/i), {
            target: { value: "5" },
        });
        fireEvent.change(screen.getByLabelText(/Course Status/i), {
            target: { value: "Active" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() =>
            expect(
                screen.getByText(/Course Created Successfully/i),
            ).toBeInTheDocument(),
        );

        expect(onCourseCreated).toHaveBeenCalled();
    });

    test("handles API on form submit", async () => {
        jest.spyOn(window, "alert").mockImplementation(() => {});

        renderComponent();
        //Form submitted successfully test
        fireEvent.change(screen.getByLabelText(/Course Title/i), {
            target: { value: "Course" },
        });
        fireEvent.change(screen.getByLabelText(/Course Code/i), {
            target: { value: "CS990" },
        });
        fireEvent.change(screen.getByLabelText(/Course Director/i), {
            target: { value: "2" },
        });
        fireEvent.change(screen.getByLabelText(/Description/i), {
            target: { value: "Course" },
        });
        fireEvent.change(screen.getByLabelText(/Number of Lessons/i), {
            target: { value: "5" },
        });
        fireEvent.change(screen.getByLabelText(/Course Status/i), {
            target: { value: "Active" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() => expect(window.alert).toHaveBeenCalled());
    });

    test("discard button resets form", () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Course Title/i), {
            target: { value: "Temporary Course" },
        });
        fireEvent.change(screen.getByLabelText(/Number of Lessons/i), {
            target: { value: "3" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Discard/i }));

        expect(
            screen.queryByDisplayValue("Temp Course"),
        ).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue("3")).not.toBeInTheDocument();
    });

    test("navigates to course page after success modal", async () => {
        api.post.mockResolvedValue({ data: { course_id: "CS101" } });

        renderComponent();
        //Test navigation after creating course
        fireEvent.change(screen.getByLabelText(/Course Title/i), {
            target: { value: "Algorithms 101" },
        });
        fireEvent.change(screen.getByLabelText(/Course Code/i), {
            target: { value: "CS102" },
        });
        fireEvent.change(screen.getByLabelText(/Course Director/i), {
            target: { value: "1" },
        });
        fireEvent.change(screen.getByLabelText(/Description/i), {
            target: { value: "Intro to algorithms" },
        });
        fireEvent.change(screen.getByLabelText(/Number of Lessons/i), {
            target: { value: "5" },
        });
        fireEvent.change(screen.getByLabelText(/Course Status/i), {
            target: { value: "Active" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() =>
            expect(
                screen.getByText(/Course Created Successfully/i),
            ).toBeInTheDocument(),
        );

        fireEvent.click(
            screen.getByRole("button", { name: /Go to course page/i }),
        );

        expect(mockNavigate).toHaveBeenCalledWith("/instructor/course-list");
    });
});
